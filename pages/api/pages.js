// pages/api/pages.js
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const siteId = req.query.siteId;
  if (!siteId) {
    return res.status(400).json({ error: 'Missing siteId' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token found' });
  }

  try {
    const apiRes = await fetch(`https://api.webflow.com/rest/sites/${siteId}/pages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Version': '1.0.0',
        'Content-Type': 'application/json',
      },
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.message || 'Failed to fetch pages' });
    }

    res.status(200).json({ pages: data.pages });
  } catch (err) {
    console.error('API /pages error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}