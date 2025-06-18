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
    console.warn("⚠️ Invalid or missing siteId/token:", { siteId, token });
    return res.status(400).json({ error: "Missing or invalid siteId or token" });
  }

  try {
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

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Webflow API error" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}