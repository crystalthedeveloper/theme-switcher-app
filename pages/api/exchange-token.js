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

  console.log('🔐 Sending token request with:', {
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
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
    console.log('📦 Raw token response:', rawText);

    let tokenData;
    try {
      tokenData = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('❌ Failed to parse token response JSON:', parseErr);
      return res.status(500).json({ error: 'Invalid JSON in token response', rawText });
    }

    console.log('🔁 Webflow Token Response:', tokenData);

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('❌ Token request failed:', {
        status: tokenRes.status,
        response: tokenData,
      });

      let hint = 'Ensure you selected a site and are using the correct redirect URI.';
      if (tokenData.error === 'invalid_grant') {
        hint = 'The authorization code may have expired or already been used. Try the flow again.';
      }

      return res.status(400).json({
        error: tokenData.error_description || 'Token exchange failed.',
        hint,
        details: tokenData,
      });
    }

    let siteId = tokenData.site_ids?.[0];

    if (!siteId) {
      console.warn('⚠️ site_ids missing. Performing fallback site lookup...');

      const sitesRes = await fetch('https://api.webflow.com/v1/sites', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'accept-version': '1.0.0',
        },
      });

      const sites = await sitesRes.json();
      console.log('🌐 Fallback site list:', sites);

      if (!Array.isArray(sites) || sites.length === 0) {
        return res.status(400).json({
          error: 'No sites found in fallback site lookup.',
          tokenData,
          rawText,
          hint: 'Double-check that you selected a valid site during the OAuth install flow. Webflow sometimes returns an empty list even if you select one.',
        });
      }

      siteId = sites[0]._id;
    }

    return res.status(200).json({
      access_token: tokenData.access_token,
      site_id: siteId,
    });

  } catch (err) {
    console.error('❌ Exception during token exchange:', err);
    return res.status(500).json({ error: 'Unexpected error during token exchange.' });
  }
}