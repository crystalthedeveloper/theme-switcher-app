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

  const scriptUrl = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const scriptName = 'Theme Switcher';

  try {
    // 1️⃣ Check existing scripts to prevent duplicates
    const listRes = await fetch('https://api.webflow.com/v2/scripts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    const scriptList = await listRes.json();
    const existing = scriptList?.scripts?.find(
      (s: any) => s.url === scriptUrl && s.name === scriptName
    );

    let scriptId = existing?.id;

    // 2️⃣ Register the script if not already present
    if (!scriptId) {
      const registerRes = await fetch('https://api.webflow.com/v2/scripts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'accept-version': '2.0.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scriptName,
          url: scriptUrl,
          loadType: 'defer',
          location: 'footer',
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok || !registerData.id) {
        console.error('❌ Script registration failed:', registerData);
        return sendError(500, 'Failed to register script');
      }

      scriptId = registerData.id;
      console.log('✅ Script registered:', scriptId);
    } else {
      console.log('♻️ Script already registered:', scriptId);
    }

    // 3️⃣ Apply the script to the site
    const attachRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/scripts`, {
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

    if (!attachRes.ok) {
      const errorText = await attachRes.text();
      console.error('❌ Failed to attach script:', attachRes.status, errorText);
      return sendError(500, 'Failed to attach script to site');
    }

    console.log('✅ Script successfully injected into site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}