// pages/api/pages.js
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { siteId } = req.query;
  if (!siteId) {
    return res.status(400).json({ error: 'Missing siteId' });
  }

  let token = null;
  try {
    const rawCookie = req.headers?.cookie || '';
    const cookies = rawCookie ? cookie.parse(rawCookie) : {};
    token = cookies.webflow_token || req.headers?.authorization?.split('Bearer ')[1];
  } catch (err) {
    console.warn('⚠️ Failed to parse cookies:', err?.message || err);
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: 'Invalid JSON response from Webflow',
        raw: text,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Failed to fetch pages',
        details: data,
      });
    }

    return res.status(200).json({ pages: data.pages || [] });
  } catch (err) {
    console.error('API /pages error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}