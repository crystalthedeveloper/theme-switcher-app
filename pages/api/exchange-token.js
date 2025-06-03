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

  // ✅ Log incoming config to debug auth bugs
  console.log('🔐 Starting token exchange with:', {
    code,
    clientId,
    redirectUri,
    clientSecretPresent: !!clientSecret,
  });

  if (!clientId || !clientSecret || !baseUrl) {
    console.error('❌ Missing environment variables');
    return res.status(500).json({ error: 'Missing Webflow API credentials.' });
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

    const rawText = await tokenRes.text();
    let tokenData;

    try {
      tokenData = JSON.parse(rawText);
    } catch (err) {
      console.error('❌ Failed to parse token response JSON:', rawText);
      return res.status(500).json({ error: 'Invalid token response from Webflow.' });
    }

    console.log('🔁 Token response received:', tokenData);

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed.',
        hint: 'Check your Webflow client ID, secret, and redirect URI.',
        details: tokenData,
      });
    }

    let siteId = tokenData.site_ids?.[0];
    console.log('📎 tokenData.site_ids:', tokenData.site_ids);

    // 🔁 Fallback to /v2/user/sites if site_ids missing
    if (!siteId) {
      console.warn('⚠️ site_ids missing. Trying /v2/user/sites as fallback...');
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
          hint: 'Ensure you selected a site during OAuth install.',
        });
      }

      siteId = data.sites[0].id;
    }

    console.log('✅ Final resolved site ID:', siteId);

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });

  } catch (err) {
    console.error('❌ Unexpected error during token exchange:', err);
    return res.status(500).json({ error: 'Unexpected server error during token exchange.' });
  }
}