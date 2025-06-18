// pages/api/pages.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { siteId, token } = req.body || {};
  console.log("🔍 Incoming POST to /api/pages with:", { siteId, hasToken: !!token });
  if (!siteId || !token || typeof siteId !== 'string' || typeof token !== 'string') {
    const reason = [
      !siteId ? "siteId is missing" : "",
      !token ? "token is missing" : "",
      typeof siteId !== 'string' ? "siteId is not a string" : "",
      typeof token !== 'string' ? "token is not a string" : ""
    ].filter(Boolean).join("; ");
    console.warn("⚠️ Invalid or missing siteId/token:", { siteId, token, reason });
    return res.status(400).json({ error: `Missing or invalid siteId/token: ${reason}` });
  }

  try {
    console.log(`🌐 Fetching pages from Webflow API for site: ${siteId}`);
    const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0",
      },
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Webflow" });
    }

    if (!data.pages) {
      console.warn("⚠️ No pages array found in Webflow API response:", data);
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Webflow API error" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}