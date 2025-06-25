// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Page-Level Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, pageId } = req.body;
  if (!siteId || !pageId) {
    return res.status(400).json({ success: false, message: 'Missing siteId or pageId' });
  }

  let token;
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];
  } catch (err) {
    console.warn('⚠️ Failed to parse token:', err);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages/${pageId}/custom_code`, {
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
      return res.status(patchRes.status).json({
        success: false,
        message: '❌ Injection failed',
        error: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected into page-level custom code!',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error during page-level injection',
      error: err.message,
    });
  }
}