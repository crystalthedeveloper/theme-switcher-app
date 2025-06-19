// pages/api/exchange-token.js

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    if (!tokenRes.ok || tokenData.error) {
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check client_id, client_secret, and redirect_uri.',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token from Webflow.' });
    }

    const fetchSites = async () => {
      try {
        const siteRes = await fetch('https://api.webflow.com/v2/sites', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'accept-version': '1.0.0',
          },
        });

        const siteRaw = await siteRes.text();
        const siteData = JSON.parse(siteRaw);
        const hostedSites = Array.isArray(siteData?.sites)
          ? siteData.sites.filter(site => site?.plan !== 'developer')
          : [];

        return hostedSites.length > 0
          ? { success: true, sites: hostedSites }
          : { success: false, reason: 'No hosted sites found' };
      } catch (e) {
        return { success: false, reason: e.message };
      }
    };

    const siteResult = await fetchSites();

    if (!siteResult.success) {
      return res.status(400).json({
        error: 'Failed to fetch sites from Webflow.',
        details: siteResult.reason,
      });
    }

    console.log("✅ Access Token starts with:", accessToken.slice(0, 6) + "...");
    console.log("✅ Sites:", siteResult?.sites);

    const siteId = siteResult?.sites?.[0]?._id || siteResult?.sites?.[0]?.id;

    if (siteResult.sites.length === 0) {
      console.warn("⚠️ No hosted sites available. User may not have any published sites.");
    }

    if (!accessToken || !siteId) {
      return res.status(400).json({
        error: 'Missing access token or site ID from Webflow. Please reauthorize.',
      });
    }

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteResult.sites,
      issued_at: Date.now(),
      expires_in: 3600,
    });
  } catch (err) {
    console.error('❌ Unexpected error during token exchange:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}