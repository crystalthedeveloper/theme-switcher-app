// pages/api/pages.js

import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { siteId } = req.body;
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.webflow_token || (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Missing access token' });

  try {
    const apiRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await apiRes.json();
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: data.message || 'Failed to fetch pages' });

    const pages = Array.isArray(data.pages) ? data.pages : [];
    const cleanedPages = pages.filter(p => p._id && p.slug).map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
    }));

    return res.status(200).json({ pages: cleanedPages });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}