// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Homepage Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : null);
  const siteId = cookies.webflow_site_id;

  if (!token || !siteId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token or siteId' });
  }

  try {
    // Step 1: Get all pages for the site
    const pagesRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !pagesData.pages) {
      return res.status(pagesRes.status).json({
        success: false,
        message: pagesData.message || '❌ Failed to fetch pages',
        error: pagesData,
      });
    }

    // Step 2: Find the homepage
    const homepage = pagesData.pages.find(p => p.slug === 'index' || p.isHomepage);

    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: '❌ Homepage not found',
      });
    }

    // Step 3: Inject script into homepage custom code
    const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;
    const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/pages/${homepage._id}/custom_code`;

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
      return res.status(injectRes.status).json({
        success: false,
        message: injectData?.message || '❌ Injection failed',
        error: injectData,
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ Script successfully injected into homepage!',
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