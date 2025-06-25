// pages/api/inject.js

import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId } = req.body;

  if (!siteId) {
    return res.status(400).json({ success: false, message: 'Missing siteId' });
  }

  let token;
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];
  } catch (err) {
    console.warn('⚠️ Failed to parse cookies:', err?.message || err);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    // ✅ Get current global custom code
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const existing = await getRes.json();
    const existingScripts = existing.scripts || [];

    // Check for existing footer script
    const footerScript = existingScripts.find((s) => s.location === 'footer')?.content || '';
    const headScript = existingScripts.find((s) => s.location === 'head')?.content || '';

    if (footerScript.includes('theme-switcher.js')) {
      return res.status(200).json({
        success: true,
        message: 'Script already injected. No action needed.',
        alreadyInjected: true,
      });
    }

    const updatedScripts = [
      {
        location: 'head',
        content: headScript,
      },
      {
        location: 'footer',
        content: `${footerScript}\n${scriptTag}`,
      },
    ];

    const putRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scripts: updatedScripts }),
    });

    const result = await putRes.json();

    if (!putRes.ok) {
      console.error('❌ Failed to inject global code:', result);
      return res.status(putRes.status).json({
        success: false,
        message: 'Failed to inject global script',
        error: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ Script injected globally!',
    });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
}