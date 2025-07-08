// /pages/api/exchange-token.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string, extra?: any) => {
    console.warn(`⚠️ ${status} – ${message}`);
    if (extra) console.error(extra);
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
  const redirectUri = process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return sendError(500, 'Missing environment variables');
  }

  console.log('📥 Received code:', code);
  if (redirectUri) console.log('📤 Using redirect_uri:', redirectUri);

  try {
    const payload: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    };

    if (redirectUri) {
      payload.redirect_uri = redirectUri;
    }

    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return sendError(500, tokenData.error_description || 'Token exchange failed', tokenData);
    }

    const access_token = tokenData.access_token;

    // ✅ Log granted scopes for debug
    console.log('✅ Granted scopes:', tokenData.scope || '(no scope returned)');

    const siteRes = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'accept-version': '2.0.0',
      },
    });

    const siteData = await siteRes.json();

    if (!Array.isArray(siteData.sites) || siteData.sites.length === 0) {
      return sendError(500, 'No authorized sites found for this user', siteData);
    }

    const site_id = siteData.sites[0].id;

    console.log('✅ OAuth exchange complete:', {
      token: '[REDACTED]',
      site_id,
    });

    return res.status(200).json({ access_token, site_id });
  } catch (err: any) {
    return sendError(500, 'Unexpected error during token exchange', err?.message || err);
  }
}