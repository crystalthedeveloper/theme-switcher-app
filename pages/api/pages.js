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

    const pages = result.pages.map((p) => ({
      id: p.id,
      slug: p.slug || 'homepage',
      name: p.name,
    }));

    return res.status(200).json({ success: true, pages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}