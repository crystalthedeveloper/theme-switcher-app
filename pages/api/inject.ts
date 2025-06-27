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
    // Step 1: Fetch existing custom code
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    const getData = await getRes.json();

    if (!getRes.ok) {
      console.error('❌ Failed to fetch existing custom code:', getData);
      return sendError(500, getData?.message || 'Could not retrieve existing custom code.');
    }

    const currentFooter = getData?.footer || '';
    const alreadyInjected = currentFooter.includes(scriptTag);

    if (alreadyInjected) {
      console.log('ℹ️ Script already injected. Skipping injection.');
      return res.status(200).json({ success: true, message: 'Script already injected' });
    }

    const updatedFooter = `${currentFooter}\n${scriptTag}`;

    // Step 2: PATCH with updated footer
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0',
      },
      body: JSON.stringify({
        footer: updatedFooter,
        head: getData?.head || '',
      }),
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      console.error('❌ Failed to inject script:', patchData);
      return sendError(500, patchData?.message || 'Script injection failed.');
    }

    console.log('✅ Script appended to footer for site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}