// pages/api/pages.ts
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
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing token or siteId',
    });
  }

  try {
    const pageRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await pageRes.json();

    if (!pageRes.ok || !result.pages) {
      return res.status(500).json({
        success: false,
        message: '❌ Failed to fetch pages',
        error: result,
      });
    }

    // ✅ Filter pages that are static and have a valid id and slug (slug === '' is homepage)
    const staticPages = result.pages.filter((p) => {
      return (
        p.type === 'static' &&
        p.id &&
        p.slug !== undefined &&
        !p.slug?.startsWith('detail_') // optional: hide CMS templates
      );
    });

    const pages = staticPages.map((p) => ({
      id: p.id,
      slug: p.slug === '' ? 'homepage' : p.slug,
      name: p.name,
    }));

    return res.status(200).json({ success: true, pages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}