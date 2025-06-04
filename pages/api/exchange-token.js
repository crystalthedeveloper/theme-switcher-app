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
      return res.status(500).json({ error: 'Invalid JSON from Webflow' });
    }

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('❌ Token exchange failed:', raw);
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check client_id, client_secret, and redirect_uri.',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;

    // Step 2: Try fetching available sites
    const sitesRes = await fetch('https://api.webflow.com/rest/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '1.0.0',
      },
    });

    const sitesRaw = await sitesRes.text();
    let sitesData;
    try {
      sitesData = JSON.parse(sitesRaw);
    } catch {
      console.warn('⚠️ Invalid JSON returned from /rest/sites:', sitesRaw);
      return res.status(200).json({
        access_token: accessToken,
        warning: 'Invalid site data received from Webflow.',
      });
    }

    const siteArray = Array.isArray(sitesData?.sites) ? sitesData.sites : sitesData;

    if (!Array.isArray(siteArray) || siteArray.length === 0) {
      return res.status(200).json({
        access_token: accessToken,
        sites: [],
        warning: 'No sites returned. Make sure the user owns a hosted site and isn’t using Developer Workspace.',
      });
    }

    const siteList = siteArray.map(site => ({
      id: site._id,
      name: site.displayName || site.name || 'Untitled',
    }));

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteList[0].id,
      sites: siteList,
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}