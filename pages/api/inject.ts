//pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  const { siteId } = req.body;

  if (!token || !siteId) {
    return res.status(400).json({ error: 'Missing token or siteId' });
  }

  try {
    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0',
      },
      body: JSON.stringify({
        head: '',
        footer: `<script src="${SCRIPT_URL}" defer></script>`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Webflow API Error:', data);
      return res.status(response.status).json({
        error: data.err || data.message || 'Failed to inject script.',
        message: `❌ Injection failed: ${data.err || 'Unknown error'}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Unexpected error during injection.' });
  }
}