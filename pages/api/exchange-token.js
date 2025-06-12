// pages/api/exchange-token.js

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  const missingEnv = {
    clientId: !clientId,
    clientSecret: !clientSecret,
    baseUrl: !baseUrl,
  };

  if (Object.values(missingEnv).includes(true)) {
    return res.status(500).json({
      error: 'Missing required environment variables.',
      details: missingEnv,
    });
  }

  try {
    // 🔁 Step 1: Exchange code for access token
    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const raw = await tokenRes.text();
    let tokenData;
    try {
      tokenData = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from Webflow' });
    }

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('❌ Token exchange failed:', raw);
      console.warn('Hint: Double-check your Webflow App settings → Callback URL must match exactly.');

      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check client_id, client_secret, and redirect_uri.',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;

    // 🔍 Step 2: Try fetching connected sites using modern REST API
    const trySitesEndpoint = async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'accept-version': '1.0.0',
          },
        });

        const raw = await response.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          return { success: false, reason: `Invalid JSON from ${url}` };
        }

        const siteArray = Array.isArray(data?.sites) ? data.sites : data;
        const hostedSites = siteArray.filter(site => site?.plan !== 'developer');

        if (!Array.isArray(hostedSites) || hostedSites.length === 0) {
          return { success: false, reason: `No hosted sites found at ${url}` };
        }

        const formatted = hostedSites.map(site => ({
          id: site._id,
          name: site.displayName || site.name || 'Untitled',
        }));

        return { success: true, sites: formatted };
      } catch (err) {
        return { success: false, reason: err.message };
      }
    };

    // 🧪 Step 3: Try modern endpoint first, then fallback
    const primary = await trySitesEndpoint('https://api.webflow.com/rest/sites');
    const fallback = !primary.success
      ? await trySitesEndpoint('https://api.webflow.com/sites')
      : null;

    const finalSites = primary.success
      ? primary.sites
      : fallback && fallback.success
        ? fallback.sites
        : [];

    // ✅ Final Response - allow fallback for testing purposes
    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: finalSites[0]?.id || null,
      sites: finalSites,
      warning: finalSites.length === 0
        ? 'No hosted sites found. Proceeding with fallback for testing.'
        : undefined,
    });

  } catch (err) {
    console.error('❌ Unexpected error during token exchange:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}