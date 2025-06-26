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
  const siteId = cookies.webflow_site_id || req.body.siteId;

  if (!token || !siteId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing token or siteId',
    });
  }

  try {
    const pagesRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      },
    });

    const pagesData = await pagesRes.json();
    console.log('📄 Raw Pages Data:', JSON.stringify(pagesData, null, 2));

    if (!pagesRes.ok || !Array.isArray(pagesData.pages)) {
      return res.status(pagesRes.status).json({
        success: false,
        message: pagesData.message || '❌ Failed to fetch pages',
        error: pagesData,
      });
    }

    let homepage = pagesData.pages.find(p => p.isHomepage && p._id);

    if (!homepage) {
      console.warn('⚠️ No homepage marked. Trying static fallback...');
      homepage = pagesData.pages.find(p => p.type === 'static' && p._id);
    }

    if (!homepage || !homepage._id) {
      console.error('❌ No valid homepage found with _id');
      return res.status(404).json({
        success: false,
        message: '❌ No homepage with valid _id found.',
      });
    }

    const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;
    const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/pages/${homepage._id}/custom_code`;

    console.log(`📦 Injecting script into page "${homepage.slug}" (ID: ${homepage._id})`);

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

    console.log(`✅ Script successfully injected into page: ${homepage.slug}`);
    return res.status(200).json({
      success: true,
      message: `✅ Script successfully injected into ${homepage.slug || 'homepage'}!`,
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