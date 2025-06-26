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

    // 🐞 Log full response for debugging
    console.log('[DEBUG] Full response from Webflow:', JSON.stringify(data, null, 2));

    // ✅ Adjust filter to catch more valid page types
    const staticPages = (data.pages || []).filter((page: any) =>
      ['static', 'home', 'generic'].includes(page.pageType)
    );

    res.status(200).json({ pages: staticPages });
  } catch (err) {
    console.error('[Webflow Pages API Error]', err);
    res.status(500).json({ error: 'Failed to fetch pages from Webflow' });
  }
}