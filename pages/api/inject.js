// pages/api/inject.js
import { getTokenFromCookies } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, pageId } = req.body;

  if (!siteId || !pageId) {
    return res.status(400).json({ success: false, message: 'Missing siteId or pageId' });
  }

  const token = getTokenFromCookies(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `
<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`;

  try {
    // Step 1: GET existing custom code
    const getRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/pages/${pageId}/custom-code`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Version': '1.0.0'
      }
    });

    const currentCode = await getRes.json();

    if (!getRes.ok || !currentCode) {
      return res.status(500).json({ success: false, message: 'Failed to fetch current footer code', details: currentCode });
    }

    const alreadyInjected = currentCode.footerCode?.includes('theme-switcher.js');

    // Avoid duplicate script injection
    const mergedFooterCode = alreadyInjected
      ? currentCode.footerCode
      : (currentCode.footerCode || '') + '\n' + scriptTag;

    // Step 2: PATCH with updated footerCode
    const patchRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/pages/${pageId}/custom-code`, {
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
      return res.status(500).json({ success: false, message: 'Webflow API error', details: errorData });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Inject failed:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}