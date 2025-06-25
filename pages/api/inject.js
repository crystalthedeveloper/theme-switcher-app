// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  console.log('🌐 [API] Inject handler called');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId, debug } = req.body;
  if (!siteId) {
    return res.status(400).json({ success: false, message: 'Missing siteId' });
  }

  let token;
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];
  } catch (err) {
    console.warn('⚠️ Failed to parse token:', err);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    // Get existing custom code
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const existing = await getRes.json();
    const scripts = existing.scripts || [];

    const footerBlock = scripts.find((s) => s.location === 'footer');

    if (!footerBlock) {
      return res.status(400).json({
        success: false,
        message: 'No editable footer script found. Please add any dummy script in Webflow → Custom Code → Footer first.',
      });
    }

    const alreadyInjected = footerBlock.content.includes('theme-switcher.js');
    if (alreadyInjected) {
      return res.status(200).json({
        success: true,
        message: 'Script already injected.',
        alreadyInjected: true,
      });
    }

    // Add script safely at the end
    const updatedScripts = scripts.map((s) =>
      s.location === 'footer'
        ? {
            ...s,
            content: `${s.content.trim()}\n${scriptTag}`,
          }
        : s
    );

    const putRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scripts: updatedScripts }),
    });

    const result = await putRes.json();

    if (!putRes.ok) {
      return res.status(putRes.status).json({
        success: false,
        message: 'Failed to inject script',
        error: result,
      });
    }

    return res.status(200).json({ success: true, message: '✅ Script injected into footer!' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
}