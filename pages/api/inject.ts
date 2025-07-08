// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string, extra?: any) => {
    console.warn(`⚠️ ${status} – ${message}`);
    if (extra) console.error(extra);
    return res.status(status).json({ success: false, message });
  };

  if (req.method !== 'POST') return sendError(405, 'Method Not Allowed');

  const { siteId } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!siteId || !token) return sendError(400, 'Missing siteId or token');

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    const apiRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code/settings`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: {
          head: "",
          footer: scriptTag,
        }
      }),
    });

    const data = await apiRes.json();
    if (!apiRes.ok) return sendError(apiRes.status, 'Failed to inject footer script', data);

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return sendError(500, 'Unexpected error', err.message || err);
  }
}