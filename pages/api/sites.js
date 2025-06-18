// pages/api/sites.js

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { token } = req.body;
  if (!token) return res.status(401).json({ error: "Missing token" });

  const fetchSitesFrom = async (url) => {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "accept-version": "1.0.0",
          "Content-Type": "application/json",
        },
      });

      const raw = await res.text();
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        return { ok: false, code: 502, error: "Invalid JSON", raw };
      }

      if (!res.ok) {
        const isExpired = res.status === 401 || res.status === 403;
        return { ok: false, code: res.status, error: json?.message || "Webflow error", isExpired };
      }

      const sites = Array.isArray(json?.sites) ? json.sites : json;
      const hostedSites = sites.filter((site) => site.plan !== "developer");

      return { ok: true, sites: hostedSites };
    } catch (err) {
      return { ok: false, code: 500, error: "Unexpected error", details: err.message };
    }
  };

  const primary = await fetchSitesFrom("https://api.webflow.com/rest/sites");
  const fallback = !primary.ok ? await fetchSitesFrom("https://api.webflow.com/sites") : null;

  const final = primary.ok ? primary : fallback?.ok ? fallback : null;

  if (!final) {
    const error = fallback?.error || primary.error || "Unknown error";
    const code = fallback?.code || primary.code || 500;
    const expired = fallback?.isExpired || primary.isExpired || false;

    return res.status(code).json({
      error,
      expiredToken: expired,
    });
  }

  return res.status(200).json({ sites: final.sites });
}