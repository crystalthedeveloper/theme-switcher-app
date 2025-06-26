// pages/api/inject.ts
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Inject handler called (Site-wide)');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const authHeader = req.headers.authorization || '';
  const token =
    req.body.token ||
    cookies.webflow_token ||
    (authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null);

  const siteId = req.body.siteId || cookies.webflow_site_id;

  if (!token || !siteId) {
    console.warn('⚠️ Missing token or siteId', { token, siteId });
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing token or siteId',
    });
  }

  const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/custom_code`;
  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    const injectRes = await fetch(injectUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        footer: scriptTag, // ✅ injects into site-wide footer
      }),
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

    console.log(`✅ Script injected into site: ${siteId}`);
    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected into site-wide footer!',
    });
  } catch (err) {
    console.error('❌ Server error during injection:', err);
    return res.status(500).json({
      success: false,
      message: '❌ Server error during injection',
      error: err.message,
    });
  }
}