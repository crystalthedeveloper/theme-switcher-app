// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sendError = (status: number, message: string, extra?: any) => {
    console.warn(`⚠️ ${status} – ${message}`);
    if (extra) console.error(extra);
    return res.status(status).json({ success: false, message });
  };

  if (req.method !== 'POST') {
    return sendError(405, 'Method Not Allowed');
  }

  const { siteId } = req.body;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  console.log('📩 Incoming request:', { siteId, tokenPresent: !!token });

  if (!token || !siteId) {
    return sendError(400, 'Missing siteId or token');
  }

  const scriptUrl = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';

  try {
    // 🔄 Overwrite footer code with theme switcher script
    const updateRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        footer: `<script src="${scriptUrl}" defer></script>`,
      }),
    });

    const updateText = await updateRes.text();
    console.log('🔧 Update custom code response:', updateText);

    if (!updateRes.ok) {
      return sendError(500, 'Failed to inject script', updateText);
    }

    console.log(`✅ Theme Switcher script injected into site ${siteId}`);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('🔥 Unexpected error:', err);
    return sendError(500, 'Internal Server Error', err?.message || err);
  }
}