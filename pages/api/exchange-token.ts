// /pages/api/exchange-token.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        redirect_uri: process.env.WEBFLOW_REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Failed to exchange token' });
    }

    const access_token = data.access_token;
    const site_id = data.sites?.[0]?._id;

    if (!access_token || !site_id) {
      return res.status(500).json({ error: 'Missing access token or site ID' });
    }

    return res.status(200).json({ access_token, site_id });
  } catch (error: any) {
    console.error('❌ Exchange error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}