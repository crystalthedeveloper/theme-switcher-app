// pages/api/exchange-token.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('🔁 Full Token Response from Webflow:', tokenData); // helpful for debugging

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