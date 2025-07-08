// /pages/api/exchange-token.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string, extra?: any) => {
    console.warn(`⚠️ ${status} – ${message}`);
    if (extra) console.error('🔎 Extra Debug Info:', extra);
    return res.status(status).json({ error: message });
  };

  console.log('📡 Incoming request to /api/exchange-token');

  if (req.method !== 'POST') {
    console.warn('❌ Invalid HTTP method:', req.method);
    return sendError(405, 'Method Not Allowed');
  }

  const { code } = req.body;
  console.log('📥 Received code in body:', code);

  if (!code || typeof code !== 'string') {
    return sendError(400, 'Missing or invalid authorization code', req.body);
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI;

  console.log('🔐 Loaded environment variables:', {
    clientIdPresent: !!clientId,
    clientSecretPresent: !!clientSecret,
    redirectUri,
  });

  if (!clientId || !clientSecret || !redirectUri) {
    return sendError(500, 'Missing environment variables', {
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  try {
    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri, // ✅ REQUIRED and must match Webflow settings
    };

    console.log('📤 Sending payload to Webflow token endpoint:', payload);

    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const tokenData = await tokenRes.json();

    console.log('📬 Token response status:', tokenRes.status);
    console.log('📬 Token response body:', tokenData);

    if (!tokenRes.ok || !tokenData.access_token) {
      return sendError(500, tokenData.error_description || 'Token exchange failed', tokenData);
    }

    const access_token = tokenData.access_token;

    console.log('🌐 Fetching authorized sites...');
    const siteRes = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'accept-version': '2.0.0',
      },
    });

    const siteData = await siteRes.json();

    if (!Array.isArray(siteData.sites) || siteData.sites.length === 0) {
      return sendError(500, 'No authorized sites found', siteData);
    }

    const site_id = siteData.sites[0].id;

    console.log('✅ OAuth complete:', { site_id });
    return res.status(200).json({ access_token, site_id });

  } catch (err: any) {
    return sendError(500, 'Unexpected error during token exchange', err?.message || err);
  }
}