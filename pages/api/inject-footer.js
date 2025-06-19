// pages/api/inject-footer.js

import applyRateLimit from '../../lib/rateLimiter';

export default async function handler(req, res) {
  //await applyRateLimit(req, res)
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  console.log("📥 Incoming request body:", req.body);
  console.log("🔎 Method:", req.method);

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

  // Validate Webflow site ID format (24-char hex)
  if (!/^[a-f0-9]{24}$/i.test(siteId)) {
    issues.push("Invalid siteId format (should be 24 hex chars)");
  }

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
      currentFooterRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom-code`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          "accept-version": "2.0.0",
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

    const patchUrl = `https://api.webflow.com/v2/sites/${siteId}/custom-code`;
    console.log("🧩 PATCH URL (v2):", patchUrl);
    console.log("📡 Preparing to PATCH to Webflow API");

    console.log("📤 PATCH request body:", {
      footer: currentFooterCode + '\n' + scriptTag,
    });

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        footer: currentFooterCode + '\n' + scriptTag,
      }),
    });

    console.log("📨 PATCH response received");
    console.log("📨 PATCH status:", patchRes.status, patchRes.statusText);

    let patchData;
    try {
      patchData = await patchRes.json();
    } catch (err) {
      console.log("❗ Error parsing PATCH response JSON. Raw response body will be dumped if available.");
      console.error("❌ Failed to parse JSON from PATCH response:", {
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).json({ error: "Invalid JSON response from Webflow", details: err.message });
    }

    if (!patchRes.ok) {
      const errorMessage = patchData.message || patchData.error || "Webflow API PATCH failed";
      const logDetails = {
        status: patchRes.status,
        statusText: patchRes.statusText,
        url: patchUrl,
        tokenPrefix: token?.slice(0, 6) + "...",
        requestBody: {
          customCode: {
            footer: currentFooterCode + '\n' + scriptTag,
          },
        },
        responseBody: patchData,
      };
      console.error("❌ PATCH request to Webflow failed", logDetails);

      return res.status(patchRes.status).json({
        error: errorMessage,
        details: logDetails,
      });
    }

    console.log("🎉 PATCH completed successfully. Injected script into footer.");
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