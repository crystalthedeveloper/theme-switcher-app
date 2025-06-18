// pages/api/pages.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { siteId, token } = req.body || {};

  if (!siteId || !token) {
    return res.status(400).json({ error: "Missing siteId or token" });
  }

  try {
    const result = await fetch(`https://api.webflow.com/sites/${siteId}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0",
      },
    });

    const data = await result.json();

    if (!result.ok) {
      return res.status(result.status).json({ error: data.message || "Webflow API error" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}