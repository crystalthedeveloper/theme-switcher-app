// pages/api/inject-footer.js
import { applyRateLimit } from '../../lib/rateLimiter'

export default async function handler(req, res) {
  await applyRateLimit(req, res)
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    console.warn("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method Not Allowed", allowed: ["POST"] });
  }

  const { siteId, token } = req.body || {};
  console.log("🔧 Injecting script into global footer:", {
    siteId,
    tokenPrefix: token?.slice(0, 6) + "...",
  });

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
    // Optional: Skip if already injected
    let currentFooterRes;
    try {
      currentFooterRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          "accept-version": "1.0.0",
        },
      });
    } catch (fetchErr) {
      console.error("❌ Failed to fetch current footer from Webflow API:", {
        message: fetchErr.message,
        stack: fetchErr.stack,
      });
      return res.status(502).json({ error: "Failed to fetch current footer from Webflow API", details: fetchErr.message });
    }

    const currentFooterText = await currentFooterRes.text();
    let currentFooterData = {};
    try {
      currentFooterData = JSON.parse(currentFooterText);
    } catch {
      console.error("❌ Failed to parse JSON from Webflow footer GET response:", currentFooterText);
      return res.status(500).json({ error: "Invalid JSON when fetching current footer", raw: currentFooterText });
    }

    const currentFooterCode = currentFooterData.footer || "";
    if (currentFooterCode.includes('theme-switcher.js')) {
      console.log("⚠️ Script already present in global footer. Skipping injection.");
      return res.status(200).json({ message: "Script already exists in global footer" });
    }

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
      console.error("❌ Failed to parse JSON from PATCH response:", patchText);
      return res.status(500).json({ error: "Invalid JSON response from Webflow", raw: patchText });
    }

    if (!patchRes.ok) {
      console.error("❌ Webflow API error:", patchData.message || patchData);
      return res.status(patchRes.status).json({
        error: patchData.message || "Webflow API error",
        fullResponse: patchData,
      });
    }

    console.log("✅ Script injected successfully into global footer");
    res.status(200).json({ message: "Script injected successfully into global footer" });

  } catch (err) {
    console.error("❌ Unexpected error during injection:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Unexpected error", details: err.message, stack: err.stack });
  }
}