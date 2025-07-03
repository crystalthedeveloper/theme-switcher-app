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

  const scriptURL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';

  try {
    // 1️⃣ Try to find existing script first
    const existingScriptsRes = await fetch('https://api.webflow.com/v2/scripts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    const existingScriptsData = await existingScriptsRes.json();
    const existingScript = existingScriptsData.scripts?.find((s: any) => s.url === scriptURL);

    let scriptId = existingScript?.id;

    // 2️⃣ Register if not already present
    if (!scriptId) {
      const scriptRes = await fetch('https://api.webflow.com/v2/scripts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'accept-version': '2.0.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Theme Switcher',
          url: scriptURL,
          loadType: 'defer',
          location: 'footer',
        }),
      });

      const scriptData = await scriptRes.json();

      if (!scriptRes.ok || !scriptData.id) {
        console.error('❌ Script registration failed:', scriptData);
        return sendError(500, 'Script registration failed');
      }

      scriptId = scriptData.id;
      console.log('📌 Script registered:', scriptId);
    } else {
      console.log('♻️ Using existing script:', scriptId);
    }

    // 3️⃣ Inject the script into the site
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scripts: [scriptId],
      }),
    });

    if (!patchRes.ok) {
      const errorText = await patchRes.text();
      console.error('❌ Webflow injection error:', patchRes.status, errorText);
      return sendError(500, 'Webflow script injection failed.');
    }

    console.log('✅ Script injected successfully for site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}