// pages/api/exchange-token.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // ✅ Log and validate environment variables
  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  if (!clientId || !clientSecret || !baseUrl) {
    console.error('❌ Missing one or more environment variables:', {
      clientId,
      clientSecretPresent: !!clientSecret,
      baseUrl,
    });
    return res.status(500).json({ error: 'Server misconfigured — missing environment variables.' });
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

    const tokenData = await tokenRes.json();
    console.log('🔁 Full Token Response from Webflow:', tokenData);

    if (!tokenRes.ok || tokenData.error) {
      return res.status(400).json({
        error: tokenData.error_description || tokenData.msg || 'Token request failed',
        details: tokenData,
      });
    }

    // 🛠 Fallback: fetch site list if not returned in token
    let siteId = tokenData.site_ids?.[0];

    if (!siteId) {
      console.warn('⚠️ site_ids missing from token, fetching sites manually...');
      const sitesRes = await fetch('https://api.webflow.com/v1/sites', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const sites = await sitesRes.json();
      console.log('🌐 Fallback site lookup result:', sites);

      if (!Array.isArray(sites) || sites.length === 0) {
        return res.status(400).json({ error: 'No sites found in fallback site lookup.' });
      }

      siteId = sites[0]._id;
    }

    res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });
  } catch (err) {
    console.error('❌ Token exchange failed:', err);
    res.status(500).json({ error: 'Internal server error during token exchange.' });
  }
}