// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Homepage Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.webflow_token || (req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split('Bearer ')[1]
    : null);
  const siteId = cookies.webflow_site_id || req.body.siteId;

  if (!token || !siteId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token or siteId' });
  }

  try {
    const pagesRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !Array.isArray(pagesData.pages)) {
      console.error('❌ Pages API failed:', pagesData);
      return res.status(500).json({ success: false, message: 'Failed to fetch site pages', error: pagesData });
    }

    console.log('🧾 Pages received:', pagesData.pages.map(p => ({
      name: p.name,
      slug: p.slug,
      id: p.id,
      isHomepage: p.isHomepage,
    })));

    // ✅ Safely check for homepage
    let homepage = pagesData.pages.find(p => p.isHomepage);

    // 🛡️ Safe fallback match by name or slug
    if (!homepage) {
      homepage = pagesData.pages.find(p =>
        (p.name && p.name.toLowerCase().includes('home')) ||
        p.slug === 'home' || p.slug === 'index'
      );
      console.warn('⚠️ Fallback page used:', homepage?.name || homepage?.slug);
    }

    if (!homepage?.id) {
      return res.status(404).json({ success: false, message: '❌ No homepage with valid id found.' });
    }

    const injectUrl = `https://api.webflow.com/v2/sites/${siteId}/pages/${homepage.id}/custom_code`;
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

    console.log(`✅ Script injected into page: ${homepage.name || homepage.slug}`);
    return res.status(200).json({
      success: true,
      message: `✅ Script successfully injected into ${homepage.name || homepage.slug || 'homepage'}!`,
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