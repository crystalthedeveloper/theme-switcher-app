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

    // 🐞 Log all pages from Webflow to inspect actual structure
    console.log('[DEBUG] Full page data from Webflow:', JSON.stringify(data.pages, null, 2));

    const pages = (data.pages || []).filter((page: any) => {
      // ⚙️ Adjust this list based on actual values in your Webflow project
      return ['static', 'home', 'generic', 'page', 'standard'].includes(page.pageType)
        && page.slug && page.id; // Require slug + id for injection to work
    });

    if (pages.length === 0) {
      console.warn('⚠️ No static/home-like pages matched your filters.');
    }

    return res.status(200).json({ pages });
  } catch (err: any) {
    console.error('[Webflow Pages API Error]', err);
    return res.status(500).json({ error: 'Failed to fetch pages from Webflow' });
  }
}