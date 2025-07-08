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

  if (!token || !siteId) {
    return sendError(400, 'Missing siteId or token');
  }

  const scriptUrl = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const scriptName = 'Theme Switcher';

  try {
    // 🔍 Step 1: List current scripts
    const listRes = await fetch('https://api.webflow.com/v2/scripts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      if (listRes.status === 403 || errText.includes('route not found')) {
        return sendError(403, 'Custom Code API not available for this app yet. Awaiting Webflow approval.', errText);
      }
      return sendError(500, 'Could not fetch script list', errText);
    }

    const listData = await listRes.json();
    const existingScript = listData?.scripts?.find(
      (s: any) => s.url === scriptUrl && s.name === scriptName
    );
    let scriptId = existingScript?.id;

    // 🧱 Step 2: Register the script if not found
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

      if (!registerRes.ok || !registerData?.id) {
        return sendError(500, 'Failed to register script', registerData);
      }

      scriptId = registerData.id;
      console.log('✅ Registered new script ID:', scriptId);
    } else {
      console.log('♻️ Script already exists:', scriptId);
    }

    // 🔗 Step 3: Attach script to the given site
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
      const attachText = await attachRes.text();
      return sendError(500, 'Failed to attach script to site', attachText);
    }

    console.log(`✅ Script successfully attached to site ${siteId}`);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return sendError(500, 'Internal Server Error', err?.message || err);
  }
}