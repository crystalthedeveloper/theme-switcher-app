// /pages/api/exchange-token.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string) => {
    console.warn(`⚠️ ${status} – ${message}`);
    return res.status(status).json({ error: message });
  };

  if (req.method !== 'POST') {
    return sendError(405, 'Method Not Allowed');
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return sendError(400, 'Missing or invalid authorization code');
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const rawRedirectUri = process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI;
  const redirectUri = rawRedirectUri?.split('?')[0];

  if (process.env.NODE_ENV === 'development') {
    console.log('📥 Received code:', code);
  }

  console.log('📤 Using redirect_uri:', redirectUri);

  if (!clientId || !clientSecret || !redirectUri) {
    return sendError(500, 'Missing environment variables');
  }

  try {
    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('❌ Token exchange failed:', tokenData);
      return sendError(500, tokenData.error_description || 'Token exchange failed');
    }

    const access_token = tokenData.access_token;

    const siteRes = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'accept-version': '2.0.0',
      },
    });

    const siteData = await siteRes.json();

    if (!Array.isArray(siteData.sites) || siteData.sites.length === 0) {
      console.error('❌ No sites returned:', siteData);
      return sendError(500, 'No authorized sites found for this user');
    }

    const site_id = siteData.sites[0].id;

    console.log('✅ OAuth success:', {
      access_token: '[REDACTED]',
      site_id,
    });

    return res.status(200).json({ access_token, site_id });
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message || err);
    return sendError(500, 'Unexpected error during token exchange');
  }
}