// pages/api/exchange-token.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    console.warn('⚠️ Missing environment variables:', { clientId, clientSecret, redirectUri });
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

    if (tokenData.error) {
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error,
        details: tokenData,
      });
    }

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        error: tokenData.msg || 'Token request failed',
        details: tokenData,
      });
    }

    res.status(200).json(tokenData);
  } catch (err) {
    console.error('❌ Token exchange failed:', err);
    res.status(500).json({ error: 'Internal server error during token exchange.' });
  }
}