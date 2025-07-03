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
    // 1️⃣ Fetch existing custom code
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    if (!getRes.ok) {
      const errorText = await getRes.text();
      console.error('❌ Failed to fetch existing footer:', getRes.status, errorText);
      return sendError(500, 'Failed to read existing custom code.');
    }

    const currentData = await getRes.json();
    const currentFooter = currentData.footer || '';
    const currentHead = currentData.head || '';

    // 2️⃣ Check if the script is already injected
    if (currentFooter.includes(scriptTag)) {
      console.log('♻️ Script already present in footer.');
      return res.status(200).json({ success: true, message: 'Script already injected.' });
    }

    // 3️⃣ Append script safely
    const updatedFooter = currentFooter + '\n' + scriptTag;

    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        footer: updatedFooter,
        head: currentHead, // preserve existing head
      }),
    });

    if (!patchRes.ok) {
      const errorText = await patchRes.text();
      console.error('❌ Injection failed:', patchRes.status, errorText);
      return sendError(500, 'Webflow script injection failed.');
    }

    console.log('✅ Script successfully appended to footer for site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}