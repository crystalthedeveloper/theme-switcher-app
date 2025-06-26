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
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token or siteId' });
  }

  try {
    const structureRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/structure`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const structure = await structureRes.json();

    if (!structureRes.ok || !structure?.routes) {
      return res.status(500).json({ success: false, message: 'Failed to fetch structure', error: structure });
    }

    const staticPages = structure.routes
      .filter(p => p.page?.id && p.type === 'static')
      .map(p => ({
        id: p.page.id,
        slug: p.slug,
        type: p.type,
      }));

    return res.status(200).json({ success: true, pages: staticPages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}