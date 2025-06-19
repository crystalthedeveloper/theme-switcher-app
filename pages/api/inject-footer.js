// pages/api/inject-footer.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { siteId, token } = req.body || {};
  console.log("🔧 Injecting script into global footer:", { siteId, hasToken: !!token });

  const issues = [];
  if (!siteId || typeof siteId !== 'string') issues.push("Missing or invalid siteId");
  if (!token || typeof token !== 'string') issues.push("Missing or invalid token");

  if (issues.length > 0) {
    console.warn("⚠️ Request rejected due to:", issues.join("; "));
    return res.status(400).json({
      error: "Missing or invalid parameters",
      details: issues,
      hint: "Ensure the request includes a valid 'siteId' and 'token' as strings.",
    });
  }

  const scriptTag = `
<!-- Installed by Theme Switcher Webflow App -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        footer: scriptTag,
        enabled: true,
      }),
    });

    const patchText = await patchRes.text();
    let patchData;
    try {
      patchData = JSON.parse(patchText);
    } catch {
      return res.status(500).json({ error: "Invalid JSON response from Webflow" });
    }

    if (!patchRes.ok) {
      console.error("❌ Webflow API error:", patchData.message || patchData);
      return res.status(patchRes.status).json({
        error: patchData.message || "Webflow API error",
      });
    }

    console.log("✅ Script injected successfully into global footer");
    res.status(200).json({ message: "Script injected successfully into global footer" });

  } catch (err) {
    console.error("❌ Unexpected error during injection:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}