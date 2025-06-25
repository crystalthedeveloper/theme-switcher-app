// pages/api/inject.js

import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, pageId } = req.body;

  if (!siteId || !pageId) {
    return res.status(400).json({
      success: false,
      message: 'Missing siteId or pageId',
    });
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
    // 🔍 Step 1: Check existing custom code on this page
    const getRes = await fetch(`https://api.webflow.com/sites/${siteId}/pages/${pageId}/customcode`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '1.0.0',
      },
    });

    if (getRes.status === 401) {
      return res.status(401).json({ success: false, message: 'Token expired or invalid. Please reauthenticate.' });
    }

    const existingData = await getRes.json();
    const existingFooter = existingData.footer || '';

    // 🚫 Skip if already injected
    if (existingFooter.includes('theme-switcher.js')) {
      return res.status(200).json({
        success: true,
        message: 'Script already injected. No action needed.',
        alreadyInjected: true,
      });
    }

    // 🧩 Step 2: Merge and inject
    const mergedFooter = `${existingFooter}\n${scriptTag}`;

    const putRes = await fetch(`https://api.webflow.com/sites/${siteId}/pages/${pageId}/customcode`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '1.0.0',
      },
      body: JSON.stringify({
        head: existingData.head || '',
        footer: mergedFooter,
      }),
    });

    const data = await putRes.json();

    if (!putRes.ok) {
      console.error('❌ Failed to inject code:', data);
      return res.status(putRes.status).json({
        success: false,
        message: 'Failed to inject script into page',
        data,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
}