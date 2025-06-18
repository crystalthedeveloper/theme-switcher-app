// pages/api/sites.js

export default async function handler(req, res) {
  console.log('📥 Received request:', req.method);

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { token } = req.body || {};

  if (!token || typeof token !== 'string' || token.length < 20) {
    console.warn('⚠️ Invalid or missing token:', token);
    return res.status(400).json({ error: "Missing or invalid token" });
  }

  const fetchSitesFrom = async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "accept-version": "1.0.0",
        },
      });

      const raw = await response.text();
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error("❌ Invalid JSON from Webflow:", raw);
        return { ok: false, code: 502, error: "Invalid JSON", raw };
      }

      if (!response.ok) {
        const isExpired = response.status === 401 || response.status === 403;
        console.warn(`⚠️ Webflow error [${response.status}]:`, parsed?.message || raw);
        return {
          ok: false,
          code: response.status,
          error: parsed?.message || "Webflow error",
          isExpired,
        };
      }

      const sites = Array.isArray(parsed?.sites) ? parsed.sites : parsed;
      const hostedSites = Array.isArray(sites)
        ? sites.filter(site => site.plan !== "developer")
        : [];

      return { ok: true, sites: hostedSites };
    } catch (err) {
      console.error("❌ Unexpected fetch error:", err.message);
      return { ok: false, code: 500, error: "Unexpected error", details: err.message };
    }
  };

  const primary = await fetchSitesFrom("https://api.webflow.com/rest/sites");
  const fallback = !primary.ok ? await fetchSitesFrom("https://api.webflow.com/sites") : null;

  const result = primary.ok ? primary : fallback?.ok ? fallback : null;

  if (!result) {
    return res.status(fallback?.code || primary.code || 500).json({
      error: fallback?.error || primary.error || "Unknown error",
      expiredToken: fallback?.isExpired || primary.isExpired || false,
    });
  }

  return res.status(200).json({ sites: result.sites });
}