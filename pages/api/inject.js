// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Inject handler called');

  if (req.method !== 'POST') {
    console.warn('⛔ Invalid method:', req.method);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, debug } = req.body;
  if (!siteId) {
    console.warn('⚠️ Missing siteId');
    return res.status(400).json({ success: false, message: 'Missing siteId' });
  }

  let token;
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];
    console.log('🔑 Token found:', !!token);
  } catch (err) {
    console.warn('⚠️ Failed to parse cookies:', err?.message || err);
  }

  if (!token) {
    console.error('❌ No token found');
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;
  console.log('📦 Script to inject:', scriptTag);

  try {
    console.log(`📥 Fetching existing custom code for site ${siteId}`);
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const existing = await getRes.json();
    const existingScripts = existing.scripts || [];

    console.log('🧩 Existing scripts:', existingScripts);

    // 🔍 Optional: Return early if in debug mode
    if (debug === true) {
      return res.status(200).json({
        success: true,
        debug: true,
        message: 'Returning raw custom_code data for inspection.',
        raw: existing,
      });
    }

    const footerScript = existingScripts.find((s) => s.location === 'footer');
    if (!footerScript || !footerScript.id || !footerScript.version) {
      console.error('⚠️ No valid footer script block found with required id + version');
      return res.status(400).json({
        success: false,
        message: 'Please add any dummy code to the Webflow footer in the dashboard first, then try again.',
      });
    }

    const hasScript = footerScript.content.includes('theme-switcher.js');
    if (hasScript) {
      console.log('✅ Script already present in footer. Skipping injection.');
      return res.status(200).json({
        success: true,
        message: 'Script already injected. No action needed.',
        alreadyInjected: true,
      });
    }

    console.log('➕ Injecting script into existing footer block...');
    const updatedScripts = existingScripts.map((s) => {
      if (s.location === 'footer') {
        return {
          id: s.id,
          version: s.version,
          location: s.location,
          content: `${s.content.trim()}\n${scriptTag}`,
        };
      }
      return {
        id: s.id,
        version: s.version,
        location: s.location,
        content: s.content,
      };
    });

    console.log('🚀 Sending PUT to Webflow with updated scripts...');
    const putRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scripts: updatedScripts }),
    });

    const result = await putRes.json();
    console.log('📤 Webflow response:', result);

    if (!putRes.ok) {
      console.error('❌ Failed to inject global code:', result);
      return res.status(putRes.status).json({
        success: false,
        message: 'Failed to inject global script',
        error: result,
      });
    }

    console.log('✅ Script successfully injected!');
    return res.status(200).json({ success: true, message: '✅ Script injected into footer!' });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
}