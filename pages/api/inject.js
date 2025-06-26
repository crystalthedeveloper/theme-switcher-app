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
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token or siteId' });
  }

  try {
    const structureRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/structure`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const structure = await structureRes.json();

    if (!structureRes.ok || !structure || !Array.isArray(structure.routes)) {
      console.error('❌ Structure API failed:', structure);
      return res.status(500).json({ success: false, message: 'Failed to fetch site structure', error: structure });
    }

    console.log('🧾 Pages Info:', structure.routes.map(p => ({
      slug: p.slug,
      pageId: p.page?.id,
      isHomepage: p.isHome || false
    })));

    let homepage = structure.routes.find(p => p.isHome === true);

    if (!homepage || !homepage.page?.id) {
      console.warn('⚠️ No homepage marked. Trying fallback...');
      homepage = structure.routes.find(p => p.slug === 'home' || p.slug === 'index' || p.page?.id);
    }

    if (!homepage || !homepage.page?.id) {
      console.error('❌ No valid homepage found with pageId');
      return res.status(404).json({ success: false, message: '❌ No homepage with valid _id found.' });
    }

    const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/pages/${homepage.page.id}/custom_code`;
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

    console.log(`✅ Script injected into page: ${homepage.slug}`);
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