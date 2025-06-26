// /pages/api/exchange-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.warn('⚠️ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;
  console.log('📥 Received code:', code);

  if (!code) {
    console.warn('⚠️ Missing code in request body');
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID as string;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET as string;
  const redirectUri = process.env.WEBFLOW_REDIRECT_URI as string;

  console.log('🛠 Using env:', {
    clientIdPresent: !!clientId,
    clientSecretPresent: !!clientSecret,
    redirectUri,
  });

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Missing Webflow OAuth environment config:', {
      clientId,
      clientSecretPresent: !!clientSecret,
      redirectUri,
    });
    return res.status(500).json({ error: 'Missing Webflow OAuth environment config' });
  }

  try {
    console.log('🔁 Exchanging code for token:', {
      client_id: clientId,
      client_secret: '[HIDDEN]',
      code,
      redirect_uri: redirectUri,
    });

    const body = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('📬 Webflow token response:', data);

    if (!response.ok) {
      console.error('❌ Token exchange failed:', {
        status: response.status,
        body: data,
      });
      return res.status(500).json({ error: data.error_description || 'Failed to exchange token' });
    }

    const { access_token, sites } = data;

    if (!access_token) {
      console.error('❌ Missing access token:', data);
    }

    if (!sites || !Array.isArray(sites) || !sites.length || !sites[0]?.id) {
      console.error('❌ Missing site ID:', data);
      return res.status(500).json({ error: 'Missing access token or site ID' });
    }

    console.log('✅ Received token and site:', {
      access_token,
      site_id: sites[0].id,
    });

    return res.status(200).json({
      access_token,
      site_id: sites[0].id,
    });
  } catch (err: any) {
    console.error('❌ Exchange error:', err);
    return res.status(500).json({ error: 'Exchange failed' });
  }
}