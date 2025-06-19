// pages/api/uninstall.js

import applyRateLimit from '../../lib/rateLimiter';

export default async function handler(req, res) {
  //await applyRateLimit(req, res)

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { site_id, token, test } = req.body;
  const testMode = test === true || test === "true";

  if (!site_id || !token) {
    return res.status(400).json({ error: "Missing site_id or token" });
  }

  try {
    if (testMode) {
      console.log(`🧪 [Uninstall] Starting cleanup for site: ${site_id} | token: [masked]`);
    }

    const pagesRes = await fetch(`https://api.webflow.com/v2/sites/${site_id}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept-version": "2.0.0",
      },
    });

    if (!pagesRes.ok) {
      const errText = await pagesRes.text();
      throw new Error(`Webflow API failed to return pages. Status: ${pagesRes.status}. Response: ${errText}`);
    }

    const pagesData = await pagesRes.json();
    const pages = pagesData.pages || [];

    if (!Array.isArray(pages)) {
      throw new Error("Unexpected response format from Webflow pages API.");
    }

    if (pages.length === 0) {
      console.warn(`⚠️ [Uninstall] No pages found for site ${site_id}`);
    }

    const removeScriptTag = (body = "") =>
      body.replace(/<script[^>]*theme-switcher\.js[^>]*><\/script>/gi, "").trim();

    const results = await Promise.allSettled(
      pages.map(async (page) => {
        const cleanedBody = removeScriptTag(page.customCode?.body || "");
        const patchRes = await fetch(
          `https://api.webflow.com/sites/${site_id}/pages/${page._id}/custom-code`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "accept-version": "2.0.0",
            },
            body: JSON.stringify({ body: cleanedBody, enabled: false }),
          }
        );

        const resultText = await patchRes.text();

        if (!patchRes.ok) {
          if (testMode) console.warn(`⚠️ [Uninstall] Failed to clean page ${page._id}: ${resultText}`);
          throw new Error(`Page ${page._id} failed: ${resultText}`);
        }

        if (testMode) console.log(`✅ [Uninstall] Cleaned page ${page._id}`);
        return { page_id: page._id, status: "cleaned" };
      })
    );

    const cleaned = results.filter(r => r.status === "fulfilled").map(r => r.value);
    const failed = results.filter(r => r.status === "rejected").map(r => r.reason.message);

    if (!testMode) {
      console.log(`🔔 Theme script uninstalled on ${cleaned.length} page(s) for site ${site_id}`);
    }

    return res.status(200).json({
      message: "Uninstall cleanup completed.",
      cleaned: cleaned.length,
      failed,
    });
  } catch (err) {
    console.error("❌ [Uninstall] Cleanup error:", err.stack || err.message);
    return res.status(500).json({
      error: "Uninstall failed",
      details: err.message,
    });
  }
}