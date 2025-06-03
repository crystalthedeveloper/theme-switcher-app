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

    const rawText = await tokenRes.text();
    const tokenData = JSON.parse(rawText);

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Token exchange failed.', details: tokenData });
    }

    let siteId = tokenData.site_ids?.[0];
    console.log('📎 tokenData.site_ids:', tokenData.site_ids);

    // Fallback to v2/user/sites if site_id missing
    if (!siteId) {
      console.warn('⚠️ site_ids missing. Trying /v2/user/sites...');
      const sitesRes = await fetch('https://api.webflow.com/v2/user/sites', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'accept-version': '2.0.0',
        },
      });
      const data = await sitesRes.json();
      console.log('🌐 /user/sites response:', data);

      if (!Array.isArray(data.sites) || data.sites.length === 0) {
        return res.status(400).json({
          error: 'No sites returned from /user/sites.',
          tokenData,
          hint: 'Ensure you selected a site during OAuth install. Webflow sometimes skips it.',
        });
      }

      siteId = data.sites[0].id;
    }

    console.log('✅ Final site ID:', siteId);

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });

  } catch (err) {
    console.error('❌ Exception during token exchange:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}