// /pages/api/inject.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { siteId } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !siteId) {
    return res.status(400).json({ error: 'Missing siteId or token' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0',
      },
      body: JSON.stringify({
        footer: scriptTag,
        head: '', // optional: leave empty or customize if needed
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Webflow API error:', result);
      return res.status(500).json({ error: result?.message || 'Script injection failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Injection server error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}