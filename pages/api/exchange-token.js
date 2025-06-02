// pages/api/exchange-token.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  console.log('📥 Incoming code from client:', code);

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  if (!clientId || !clientSecret || !baseUrl) {
    console.error('❌ Missing env variables:', {
      clientId,
      clientSecretPresent: !!clientSecret,
      baseUrl,
    });
    return res.status(500).json({ error: 'Server misconfigured — missing environment variables.' });
  }

  console.log('🔐 Sending POST to Webflow with:', {
    client_id: clientId,
    client_secret: 'HIDDEN',
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

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
    console.log('📦 Raw token response text:', rawText);

    let tokenData;
    try {
      tokenData = JSON.parse(rawText);
    } catch (err) {
      console.error('❌ JSON parse error from token response:', err);
      return res.status(500).json({ error: 'Failed to parse token JSON.', rawText });
    }

    console.log('🔁 Parsed Webflow Token Response:', tokenData);

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed.',
        tokenData,
        hint: 'Check that your Webflow client_id, client_secret, and redirect_uri match the app settings exactly.',
      });
    }

    const siteId = tokenData.site_ids?.[0] || null;
    console.log('📎 site_id:', siteId);

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });
  } catch (err) {
    console.error('❌ Token exchange failed:', err);
    return res.status(500).json({ error: 'Unexpected token exchange error.' });
  }
}