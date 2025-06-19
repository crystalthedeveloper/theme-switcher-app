// pages/api/settings.js

import applyRateLimit from '../../lib/rateLimiter';

export default async function handler(req, res) {
  await applyRateLimit(req, res);

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { siteId, token, test } = req.body || {};

  if (!siteId || !token) {
    return res.status(400).json({ error: "Missing siteId or token." });
  }

  try {
    if (test) {
      console.log("🧪 Checking Webflow site status with:", {
        siteId,
        token: token?.slice(0, 6) + '...'
      });
    }

    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0"
      }
    });

    if (!response.ok) {
      const raw = await response.text();
      return res.status(response.status).json({
        error: "Unable to verify token/site.",
        details: test ? { raw, token: token?.slice(0, 6) + '...' } : undefined
      });
    }

    const siteData = await response.json();
    return res.status(200).json({
      valid: true,
      siteName: siteData.name || 'Unknown',
      plan: siteData.plan || 'Unknown',
    });
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected error verifying settings",
      message: err.message,
      token: test ? token?.slice(0, 6) + '...' : undefined
    });
  }
}