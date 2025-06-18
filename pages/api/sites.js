// pages/api/sites.js

export default async function handler(req, res) {
  console.log('📥 Received request method:', req.method);

  // Set CORS and no-cache headers
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle the preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  // Only allow POST
  if (req.method !== "POST") {
    console.warn('🚫 Method not allowed:', req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Get and validate token
  const { token } = req.body || {};
  console.log('🔐 Token received:', token?.slice(0, 6) + '... (truncated)');

  if (!token || typeof token !== 'string' || token.length < 20) {
    console.warn('⚠️ Invalid or missing token:', token);
    return res.status(400).json({ error: "Missing or invalid token" });
  }

  // Helper function to fetch sites from Webflow
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
        console.warn(`⚠️ Webflow API error from ${url} [${response.status}]:`, parsed?.message || raw);
        return {
          ok: false,
          code: response.status,
          error: parsed?.message || "Webflow error",
          isExpired,
        };
      }

      const sites = Array.isArray(parsed?.sites) ? parsed.sites : parsed;
      const hostedSites = Array.isArray(sites)
        ? sites.filter((site) => site.plan !== "developer")
        : [];

      return { ok: true, sites: hostedSites };
    } catch (err) {
      console.error("❌ Unexpected fetch error:", err.message);
      return { ok: false, code: 500, error: "Unexpected error", details: err.message };
    }
  };

  // Try REST API, fallback to legacy
  const primary = await fetchSitesFrom("https://api.webflow.com/rest/sites");
  const fallback = !primary.ok ? await fetchSitesFrom("https://api.webflow.com/sites") : null;
  if (!primary.ok && fallback?.ok) {
    console.log('🔁 Fallback API succeeded after REST failed.');
  }
  const result = primary.ok ? primary : fallback?.ok ? fallback : null;

  // Final result check
  if (!result) {
    console.error("❌ Both primary and fallback site fetches failed.");
    return res.status(fallback?.code || primary.code || 500).json({
      error: fallback?.error || primary.error || "Unknown error",
      expiredToken: fallback?.isExpired || primary.isExpired || false,
    });
  }

  if (result.sites.length === 0) {
    console.warn('⚠️ Valid token, but no hosted sites returned.');
  }
  console.log(`✅ Found ${result.sites.length} hosted site(s)`);
  return res.status(200).json({ sites: result.sites });
}