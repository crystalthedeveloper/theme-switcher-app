// pages/api/exchange-token.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({
      error: 'Missing required environment variables.',
      details: { clientId, clientSecret: !!clientSecret, baseUrl },
    });
  }

  try {
    // Step 1: Exchange code for token
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
      return res.status(500).json({ error: 'Invalid JSON response from Webflow' });
    }

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check Webflow App settings or redirect_uri.',
        details: tokenData,
      });
    }

    // Step 2: Fetch sites from REST API (Marketplace-approved)
    const sitesRes = await fetch('https://api.webflow.com/rest/sites', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'accept-version': '1.0.0',
      },
    });

    const sitesData = await sitesRes.json();
    if (!Array.isArray(sitesData?.sites) || sitesData.sites.length === 0) {
      return res.status(400).json({
        error: 'No sites returned from /rest/sites',
        hint: 'Ensure the user selected a site and the app has permissions.',
      });
    }

    const siteId = sitesData.sites[0]._id;
    const siteList = sitesData.sites.map(site => ({
      id: site._id,
      name: site.displayName || site.name || 'Untitled',
    }));

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
      sites: siteList,
    });

  } catch (err) {
    console.error('❌ Token exchange error:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}