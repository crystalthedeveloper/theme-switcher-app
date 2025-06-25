// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Page-Level Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, pageId } = req.body;

  // ✅ Validate input
  if (!siteId || !pageId) {
    return res.status(400).json({ success: false, message: 'Missing siteId or pageId' });
  }

  // ✅ Get Webflow API token
  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  // ✅ Define the script tag you want to inject
  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    // ✅ Use pageId (not slug!) in the API URL
    const url = `https://api.webflow.com/v2/sites/${siteId}/pages/${pageId}/custom_code`;

    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beforeBodyEnd: scriptTag,
      }),
    });

    const result = await patchRes.json();

    if (!patchRes.ok) {
      if (result?.code === 'RouteNotFoundError') {
        return res.status(400).json({
          success: false,
          message: '❌ This page does not support page-level custom code. Try a different one.',
          error: result,
        });
      }

      return res.status(patchRes.status).json({
        success: false,
        message: result?.message || '❌ Injection failed',
        error: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected into page-level custom code!',
    });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during injection',
      error: err.message,
    });
  }
}