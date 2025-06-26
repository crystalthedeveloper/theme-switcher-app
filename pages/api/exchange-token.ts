// /pages/api/exchange-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  try {
    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      return res.status(500).json({ error: data.message || 'Failed to exchange token' });
    }

    const { access_token, sites } = data;

    if (!access_token || !Array.isArray(sites) || !sites.length || !sites[0].id) {
      return res.status(500).json({ error: 'Missing access token or site ID' });
    }

    return res.status(200).json({
      access_token,
      site_id: sites[0].id,
    });
  } catch (err: any) {
    console.error('❌ Exchange error:', err);
    return res.status(500).json({ error: 'Exchange failed' });
  }
}