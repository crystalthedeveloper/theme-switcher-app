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

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({
      error: 'Missing required environment variables.',
      details: { clientId, clientSecret: !!clientSecret, baseUrl },
    });
  }

  try {
    // Step 1: Exchange code for access token
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
      console.error('❌ Webflow token response error:', raw);
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check Webflow App settings or redirect_uri.',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;

    // ✅ Optional: Check that required scopes were granted
    if (!tokenData.scope?.includes('sites:read')) {
      return res.status(400).json({
        error: 'Missing required scopes',
        hint: 'Ensure your app requests sites:read and other required scopes.',
        granted_scopes: tokenData.scope,
      });
    }

    // Step 2: Fetch user sites from REST API (Marketplace-approved)
    const sitesRes = await fetch('https://api.webflow.com/rest/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '1.0.0',
      },
    });

    const sitesData = await sitesRes.json();
    const siteArray = sitesData?.sites || sitesData;

    if (!Array.isArray(siteArray) || siteArray.length === 0) {
      return res.status(400).json({
        error: 'No sites returned from /rest/sites',
        hint: 'Ensure the user selected a site and your app has the correct scopes.',
      });
    }

    const siteId = siteArray[0]._id;
    const siteList = siteArray.map(site => ({
      id: site._id,
      name: site.displayName || site.name || 'Untitled',
    }));

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteList,
    });

  } catch (err) {
    console.error('❌ Token exchange error:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}