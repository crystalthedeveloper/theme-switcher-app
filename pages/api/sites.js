// pages/api/sites.js

import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Parse cookies manually for better reliability
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const apiRes = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.message || 'Failed to fetch sites' });
    }

    return res.status(200).json({ sites: data.sites });
  } catch (err) {
    console.error('API /sites error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}