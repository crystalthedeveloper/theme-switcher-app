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
    // ✅ Try a PATCH directly without GET
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        footer: scriptTag, // If GET fails, we can’t preserve existing code
        head: '', // Or provide your default head value here
      }),
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      const errorText = await patchRes.text(); // better than `.json()` fallback
      console.error('❌ Webflow injection error:', patchRes.status, errorText);
      return sendError(500, 'Webflow script injection failed.');
    }


    console.log('✅ Script injected directly for site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}