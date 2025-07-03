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
  const apiUrl = `https://api.webflow.com/v2/sites/${siteId}/custom-code`;

  try {
    // Step 1: Get existing custom code
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      console.error('❌ Failed to fetch existing footer:', errText);
      return sendError(500, 'Failed to fetch current footer code');
    }

    const existingCode = await getRes.json();
    const existingFooter = existingCode.footer || '';

    // Step 2: Avoid duplicate injection
    if (existingFooter.includes(scriptTag)) {
      console.log('♻️ Script already exists in footer.');
      return res.status(200).json({ success: true, message: 'Script already injected.' });
    }

    // Step 3: Inject script into the footer
    const updatedFooter = `${existingFooter.trim()}\n${scriptTag}`;

    const patchRes = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        head: existingCode.head || '',
        footer: updatedFooter,
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('❌ Failed to inject script:', errText);
      return sendError(500, 'Failed to update footer code');
    }

    console.log('✅ Script successfully injected into footer.');
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}