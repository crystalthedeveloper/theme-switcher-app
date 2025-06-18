// pages/api/uninstall.js

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // Preflight support
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { site_id, token, test } = req.body;
  const testMode = test === true || test === "true";

  if (!site_id || !token) {
    return res.status(400).json({ error: "Missing site_id or token" });
  }

  try {
    if (testMode) console.log(`🧪 Starting uninstall cleanup for ${site_id}`);

    // Step 1: Fetch all pages from Webflow
    const pagesRes = await fetch(`https://api.webflow.com/rest/sites/${site_id}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "1.0.0",
      },
    });

    if (!pagesRes.ok) {
      throw new Error(`Failed to fetch pages. Status: ${pagesRes.status}`);
    }

    const pagesData = await pagesRes.json();
    if (!Array.isArray(pagesData.pages)) {
      throw new Error("Invalid pages data received.");
    }

    const removeScriptTag = (body = "") =>
      body.replace(/<script[^>]*theme-switcher\.js[^>]*><\/script>/gi, "").trim();

    // Step 2: Remove the script from all pages
    const updateTasks = pagesData.pages.map(async (page) => {
      const cleaned = removeScriptTag(page.customCode?.body || "");
      const patchRes = await fetch(
        `https://api.webflow.com/rest/sites/${site_id}/pages/${page._id}/custom-code`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "accept-version": "1.0.0",
          },
          body: JSON.stringify({ body: cleaned, enabled: false }),
        }
      );

      if (!patchRes.ok) {
        const text = await patchRes.text();
        console.warn(`⚠️ Failed to clean page ${page._id}: ${text}`);
      } else if (testMode) {
        console.log(`✅ Cleaned script from page ${page._id}`);
      }
    });

    await Promise.all(updateTasks);

    // Optional: 🔔 Send email/log alert on uninstall
    if (!testMode) {
      console.log(`🔔 Uninstall cleanup completed for site: ${site_id}`);
      // Optionally send an email or external webhook here
      // await fetch('https://hooks.zapier.com/…', { method: 'POST', body: JSON.stringify({ site_id }) });
    }

    return res.status(200).json({ message: "Uninstall cleanup completed." });
  } catch (err) {
    console.error("❌ Uninstall error:", err.message);
    return res.status(500).json({ error: "Uninstall failed", details: err.message });
  }
}