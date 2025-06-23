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

  // Get token from cookie or Authorization header
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

  const scriptTag = `
<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`.trim();

  try {
    // 1. Get existing custom code
    const getRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Version': '1.0.0',
      },
    });

    const currentData = await getRes.json();

    if (!getRes.ok) {
      console.error('❌ Failed to fetch site custom code:', currentData);
      return res.status(getRes.status).json({
        success: false,
        message: 'Failed to fetch current site custom code',
        details: currentData,
      });
    }

    const currentFooter = currentData.footerCode || '';
    const alreadyInjected = currentFooter.includes('theme-switcher.js');

    const updatedFooterCode = alreadyInjected
      ? currentFooter
      : `${currentFooter}\n${scriptTag}`.trim();

    // 2. Patch the updated footer code
    const patchRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Version': '1.0.0',
      },
      body: JSON.stringify({ footerCode: updatedFooterCode }),
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      console.error('❌ Webflow PATCH error:', patchData);
      return res.status(patchRes.status).json({
        success: false,
        message: 'Failed to patch site custom code',
        details: patchData,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}