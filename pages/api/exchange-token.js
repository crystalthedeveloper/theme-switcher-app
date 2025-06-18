// pages/api/exchange-token.js

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight support
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

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
    console.log('🔁 Received auth code for exchange');
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

    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("Missing access token in response");

    if (!tokenRes.ok || tokenData.error) {
      console.error('❌ Token exchange failed:', raw);
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check client_id, client_secret, and redirect_uri.',
        details: tokenData,
      });
    }

    // 🔍 Step 2: Try fetching connected sites
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

        if (!hostedSites.length) {
          return { success: false, reason: 'No hosted sites found' };
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

    // 🧪 Step 3: Use modern endpoint
    const primary = await trySitesEndpoint('https://api.webflow.com/sites');
    const finalSites = primary.success ? primary.sites : [];

    // ✅ Final Response
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