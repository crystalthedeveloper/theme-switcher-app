// pages/api/pages.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  const { siteId } = req.query;
  const cookies = cookie.parse(req.headers.cookie || '');

  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : null);

  if (!token || !siteId) {
    console.warn('❌ Missing token or siteId', { token, siteId });
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing token or siteId',
    });
  }

  try {
    const structureRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/structure`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const structure = await structureRes.json();

    if (!structureRes.ok || !structure?.routes || !Array.isArray(structure.routes)) {
      console.error('❌ Failed to fetch valid structure', structure);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch structure or routes missing',
        error: structure,
      });
    }

    const staticPages = structure.routes
      .filter((route) => route.page?.id && route.type === 'static')
      .map((route) => ({
        id: route.page.id,
        slug: route.slug === '' ? 'homepage' : route.slug,
        type: route.type,
      }));

    console.log('✅ Static pages found:', staticPages);

    return res.status(200).json({ success: true, pages: staticPages });
  } catch (err) {
    console.error('❌ Error in /api/pages:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pages',
      error: err.message,
    });
  }
}