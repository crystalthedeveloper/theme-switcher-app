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

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `
<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`;

  try {
    // Step 1: Fetch current site-level custom code
    const getRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Version': '1.0.0'
      }
    });

    const currentCode = await getRes.json();

    if (!getRes.ok || !currentCode) {
      console.error('❌ Failed to fetch current custom code:', currentCode);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current footer code',
        details: currentCode
      });
    }

    const currentFooter = currentCode.footerCode || '';
    const alreadyInjected = currentFooter.includes('theme-switcher.js');

    const mergedFooterCode = alreadyInjected
      ? currentFooter
      : `${currentFooter}\n${scriptTag}`;

    // Step 2: Update site-level custom code
    const patchRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Version': '1.0.0'
      },
      body: JSON.stringify({ footerCode: mergedFooterCode })
    });

    if (!patchRes.ok) {
      const errorData = await patchRes.json();
      console.error('❌ Webflow PATCH error:', errorData);
      return res.status(500).json({
        success: false,
        message: 'Webflow API error during PATCH',
        details: errorData
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Inject failed:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}