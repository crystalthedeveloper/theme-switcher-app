// pages/api/inject.js
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { siteId } = req.body;

  if (!siteId) {
    return res.status(400).json({
      success: false,
      message: 'Missing siteId',
    });
  }

  let token;
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    token = cookies.webflow_token || req.headers.authorization?.split('Bearer ')[1];
  } catch (err) {
    console.warn('⚠️ Failed to parse cookies:', err?.message || err);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
  }

  const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

  try {
    // 🧾 Fetch existing site-wide custom code
    const getRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
      },
    });

    if (getRes.status === 401) {
      return res.status(401).json({ success: false, message: 'Token expired or invalid. Please reauthenticate.' });
    }

    const existingData = await getRes.json();
    const existingFooter = existingData.footer_code || '';

    // ⛔ Avoid duplicate injection
    if (existingFooter.includes('theme-switcher.js')) {
      return res.status(200).json({
        success: true,
        message: 'Script already injected globally.',
        alreadyInjected: true,
      });
    }

    const updatedFooter = `${existingFooter}\n${scriptTag}`.trim();

    // 🛠️ Inject script globally
    const patchRes = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        footer_code: updatedFooter,
      }),
    });

    const result = await patchRes.json();

    if (!patchRes.ok) {
      console.error('❌ Failed to inject global code:', result);
      return res.status(patchRes.status).json({
        success: false,
        message: 'Failed to inject site-wide script',
        data: result,
      });
    }

    return res.status(200).json({ success: true, message: 'Script successfully injected globally.', data: result });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
}