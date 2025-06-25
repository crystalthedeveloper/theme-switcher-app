// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Inject handler called');

  if (req.method !== 'POST') {
    console.warn('⛔ Invalid method:', req.method);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId } = req.body;
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

    const hasScript = existingScripts.some(
      (s) => s.location === 'footer' && s.content.includes('theme-switcher.js')
    );

    if (hasScript) {
      console.log('✅ Script already present in footer. Skipping injection.');
      return res.status(200).json({
        success: true,
        message: 'Script already injected. No action needed.',
        alreadyInjected: true,
      });
    }

    // Prepare updated scripts with proper type checking
    const updatedScripts = existingScripts.map((s) => {
      const isFooter = s.location === 'footer';
      const updatedContent = isFooter ? `${s.content}\n${scriptTag}` : s.content;
      const updated = {
        location: s.location,
        content: updatedContent,
      };
      if (typeof s.id === 'string') updated.id = s.id;
      if (typeof s.version === 'string') updated.version = s.version;
      return updated;
    });

    const hasFooterBlock = existingScripts.some((s) => s.location === 'footer');
    if (!hasFooterBlock) {
      console.log('➕ Adding new footer script block');
      updatedScripts.push({
        location: 'footer',
        content: scriptTag,
      });
    }

    console.log('🚀 Updating Webflow custom code via PUT');
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

    console.log('✅ Script injected successfully into footer');
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