// /pages/api/exchange-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;
  if (!code) {
    console.warn('⚠️ Missing code in request body');
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const redirectUri = process.env.WEBFLOW_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Missing environment variables:', {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      redirectUri: !!redirectUri,
    });
    return res.status(500).json({ error: 'Missing Webflow OAuth environment config' });
  }

  try {
    console.log('🔁 Exchanging code:', code);

    const body = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    console.log('📦 POST body:', body);

    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('📬 Webflow token response:', data);

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      return res.status(500).json({ error: data.message || 'Failed to exchange token' });
    }

    const { access_token, sites } = data;

    if (!access_token || !Array.isArray(sites) || !sites.length || !sites[0].id) {
      console.error('❌ Incomplete token or site info:', { access_token, sites });
      return res.status(500).json({ error: 'Missing access token or site ID' });
    }

    console.log('✅ Access token and site ID received:', access_token, sites[0].id);

    return res.status(200).json({
      access_token,
      site_id: sites[0].id,
    });
  } catch (err: any) {
    console.error('❌ Exchange error:', err);
    return res.status(500).json({ error: 'Exchange failed' });
  }
}