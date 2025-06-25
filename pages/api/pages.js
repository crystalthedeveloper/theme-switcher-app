// pages/api/pages.js

import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { siteId } = req.body;
  if (!siteId) {
    return res.status(400).json({ error: 'Missing siteId' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    console.log('❌ Missing access token');
    return res.status(401).json({ error: 'Missing access token' });
  }

  try {
    const apiRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await apiRes.json();
    console.log('📦 Raw pages response:', data); // ✅ Debug log

    if (!apiRes.ok) {
      console.log('❌ Webflow API error:', data);
      return res.status(apiRes.status).json({
        error: data.message || 'Failed to fetch pages',
      });
    }

    // ✅ Handle both forms: { pages: [] } or just []
    const pages = Array.isArray(data.pages)
      ? data.pages
      : Array.isArray(data)
      ? data
      : [];

    const cleanedPages = pages.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
    }));

    console.log(`✅ Loaded ${cleanedPages.length} pages for siteId ${siteId}`);

    return res.status(200).json({ pages: cleanedPages });
  } catch (err) {
    console.error('❌ /api/pages error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}