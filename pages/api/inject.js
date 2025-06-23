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

  const scriptTag = `<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    // Get existing custom_code settings first
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });

    const siteData = await getRes.json();

    if (!getRes.ok) {
      console.error('❌ Failed to fetch existing custom code:', siteData);
      return res.status(getRes.status).json({ success: false, message: 'Failed to read existing code', details: siteData });
    }

    const existingFooter = siteData.customCode?.footer || '';
    const alreadyInjected = existingFooter.includes('theme-switcher.js');
    const mergedFooter = alreadyInjected ? existingFooter : `${existingFooter}\n${scriptTag}`;

    // Now PATCH merged footer back
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0'
      },
      body: JSON.stringify({
        footerCode: mergedFooter
      }),
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      console.error('❌ PATCH failed:', patchData);
      return res.status(patchRes.status).json({
        success: false,
        message: 'Failed to update footer code',
        details: patchData,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}