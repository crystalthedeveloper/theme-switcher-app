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
    console.error('❌ Missing required env variables:', {
      clientId,
      clientSecretPresent: !!clientSecret,
      baseUrl,
    });
    return res.status(500).json({ error: 'Server misconfigured: missing environment variables.' });
  }

  console.log('🔐 Exchanging code for access token...', { code });

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
    } catch (err) {
      console.error('❌ Failed to parse JSON from Webflow:', raw);
      return res.status(500).json({ error: 'Invalid response from Webflow.' });
    }

    console.log('🔁 Token response:', tokenData);

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed',
        hint: 'Check your Webflow App settings.',
        details: tokenData,
      });
    }

    let siteId = tokenData.site_ids?.[0];

    if (!siteId) {
      console.warn('⚠️ No site_ids found in token. Using fallback: /v2/user/sites');

      const sitesRes = await fetch('https://api.webflow.com/v2/user/sites', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'accept-version': '2.0.0',
        },
      });

      const sitesData = await sitesRes.json();
      console.log('🌐 Sites from /v2/user/sites:', sitesData);

      if (!Array.isArray(sitesData.sites) || sitesData.sites.length === 0) {
        return res.status(400).json({
          error: 'No sites returned from /user/sites',
          hint: 'User likely did not select a site during OAuth install.',
        });
      }

      siteId = sitesData.sites[0].id;
    }

    console.log('✅ Final site ID resolved:', siteId);

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });

  } catch (err) {
    console.error('❌ Unexpected server error:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}