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
  const token = cookies.webflow_token;

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  try {
    const apiRes = await fetch(`https://api.webflow.com/sites/${siteId}/pages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
      },
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.message || 'Failed to fetch pages' });
    }

    return res.status(200).json({ pages: data.pages });
  } catch (err) {
    console.error('❌ /api/pages error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}