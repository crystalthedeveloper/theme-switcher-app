// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string) => {
    console.warn(`⚠️ ${status} – ${message}`);
    return res.status(status).json({ error: message });
  };

  if (req.method !== 'POST') {
    return sendError(405, 'Method Not Allowed');
  }

  const { siteId } = req.body;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token || !siteId) {
    return sendError(400, 'Missing siteId or token');
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
        head: '', // optional: leave empty or customize
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Webflow API error:', result);
      return sendError(500, result?.message || 'Script injection failed');
    }

    console.log('✅ Script injected successfully to site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Unexpected injection error:', err);
    return sendError(500, 'Internal Server Error');
  }
}