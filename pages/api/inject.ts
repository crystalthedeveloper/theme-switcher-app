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
    // 1️⃣ Get existing registered scripts
    const listRes = await fetch('https://api.webflow.com/v2/scripts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      const isNotApproved = listRes.status === 403 || errText.includes('route not found');

      console.error('❌ Failed to fetch registered scripts:', errText);

      if (isNotApproved) {
        return sendError(403, 'Custom Code API is not yet available for this app. Awaiting Webflow approval.');
      }

      return sendError(500, 'Could not fetch script list');
    }


    const listData = await listRes.json();
    let scriptId = listData.scripts?.find(
      (s: any) => s.url === scriptUrl && s.name === scriptName
    )?.id;

    // 2️⃣ Register the script if it doesn't exist
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
          location: 'footer',
          loadType: 'defer',
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok || !registerData.id) {
        console.error('❌ Failed to register script:', registerData);
        return sendError(500, 'Failed to register script');
      }

      scriptId = registerData.id;
      console.log('✅ Script registered:', scriptId);
    } else {
      console.log('♻️ Script already registered:', scriptId);
    }

    // 3️⃣ Attach registered script to the site
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
      console.error('❌ Failed to attach script to site:', errorText);
      return sendError(500, 'Failed to attach script to site');
    }

    console.log('✅ Script successfully attached to site:', siteId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Unexpected injection error:', err?.message || err);
    return sendError(500, 'Internal Server Error');
  }
}