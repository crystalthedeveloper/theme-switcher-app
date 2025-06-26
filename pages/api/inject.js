// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : null);
  const siteId = cookies.webflow_site_id || req.body.siteId;
  const pageId = req.body.pageId;

  if (!token || !siteId || !pageId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing token, siteId, or pageId',
    });
  }

  try {
    const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/pages/${pageId}/custom_code`;
    const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

    const injectRes = await fetch(injectUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ beforeBodyEnd: scriptTag }),
    });

    const injectData = await injectRes.json();

    if (!injectRes.ok) {
      console.error('❌ Injection failed:', injectData);
      return res.status(injectRes.status).json({
        success: false,
        message: injectData?.message || '❌ Injection failed',
        error: injectData,
      });
    }

    console.log(`✅ Script injected into pageId: ${pageId}`);
    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected!',
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