// /pages/api/pages.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { siteId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!siteId || !token) {
    return res.status(400).json({ error: 'Missing siteId or token' });
  }

  try {
    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Webflow API Error]', data);
      return res.status(response.status).json({ error: data.message || 'Webflow API error' });
    }

    // 🚨 TEMP: Log everything without filtering
    console.log('[🔍 DEBUG ALL PAGES]', JSON.stringify(data.pages, null, 2));

    // ✅ Send all pages back for now
    return res.status(200).json({ pages: data.pages || [] });
  } catch (err: any) {
    console.error('[Webflow Pages API Error]', err);
    return res.status(500).json({ error: 'Failed to fetch pages from Webflow' });
  }
}