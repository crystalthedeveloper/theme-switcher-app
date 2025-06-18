// pages/api/sites.js

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // Preflight response
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const response = await fetch("https://api.webflow.com/rest/sites", {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0",
        "Content-Type": "application/json",
      },
    });

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "Invalid JSON from Webflow",
        raw,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Webflow API request failed",
        details: data,
      });
    }

    const hostedSites = Array.isArray(data.sites)
      ? data.sites.filter((site) => site.plan !== "developer")
      : [];

    return res.status(200).json({ sites: hostedSites });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}