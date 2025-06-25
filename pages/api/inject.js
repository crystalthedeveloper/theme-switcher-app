// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Page-Level Inject handler called');

  if (req.method !== 'POST') {
    console.log('❌ Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, pageId } = req.body;
  console.log('📦 siteId:', siteId);
  console.log('📦 pageId:', pageId);

  if (!siteId || !pageId) {
    console.log('❌ Missing siteId or pageId');
    return res.status(400).json({ success: false, message: 'Missing siteId or pageId' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : null);

  if (!token) {
    console.log('❌ No token found in cookies or headers');
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  console.log('🔐 Using token:', token.substring(0, 10) + '...');

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;
  const url = `https://api.webflow.com/v2/sites/${siteId}/pages/${pageId}/custom_code`;

  console.log('🚀 PATCH URL:', url);

  try {
    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ beforeBodyEnd: scriptTag }),
    });

    const result = await patchRes.json();
    console.log('📨 Webflow API response:', result);

    if (!patchRes.ok) {
      if (result?.code === 'RouteNotFoundError') {
        console.log('❌ RouteNotFoundError:', result);
        return res.status(400).json({
          success: false,
          message: '❌ This page does not support page-level custom code. Try a different one.',
          error: result,
        });
      }

      console.log('❌ Other Webflow error:', patchRes.status, result);
      return res.status(patchRes.status).json({
        success: false,
        message: result?.message || '❌ Injection failed',
        error: result,
      });
    }

    console.log('✅ Injection successful');
    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected into page-level custom code!',
    });
  } catch (err) {
    console.error('❌ Server error during injection:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during injection',
      error: err.message,
    });
  }
}