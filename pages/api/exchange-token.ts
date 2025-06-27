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
  const rawRedirectUri = process.env.WEBFLOW_REDIRECT_URI;

  const redirectUri = rawRedirectUri?.replace(/\/$/, ''); // 🔁 Remove trailing slash just in case

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Missing Webflow OAuth config', {
      clientId,
      hasSecret: !!clientSecret,
      redirectUri,
    });
    return sendError(500, 'Missing Webflow OAuth environment config');
  }

  try {
    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    console.log('🔁 Exchanging code for token:', { code, redirectUri });

    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', {
        status: response.status,
        body: data,
      });
      return sendError(500, data.error_description || `Webflow token exchange failed (${response.status})`);
    }

    const { access_token, sites } = data;

    if (!access_token || !Array.isArray(sites) || !sites[0]?.id) {
      console.error('❌ Incomplete response from Webflow:', data);
      return sendError(500, 'Missing access token or site ID from Webflow');
    }

    console.log('✅ Token and Site ID received:', {
      access_token: '[REDACTED]',
      site_id: sites[0].id,
    });

    return res.status(200).json({
      access_token,
      site_id: sites[0].id,
    });
  } catch (err: any) {
    console.error('❌ Unexpected error during exchange:', err.message || err);
    return sendError(500, 'Exchange failed – unexpected server error');
  }
}