// pages/api/sites.js

import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token =
    cookies.webflow_token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split('Bearer ')[1] : null);

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

    const raw = await apiRes.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error('❌ Invalid JSON from Webflow API:', raw);
      return res.status(500).json({ error: 'Webflow API returned invalid JSON', raw });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.message || 'Failed to fetch sites' });
    }

    return res.status(200).json({ sites: data.sites });
  } catch (err) {
    console.error('❌ API /sites error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}