//pages/callback.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (!code) return;

    const exchangeTokenAndInject = async () => {
      try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID,
            client_secret: process.env.WEBFLOW_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`
          })
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        console.log('✅ Access Token:', accessToken);

        // 2. Get user’s sites
        const siteRes = await fetch('https://api.webflow.com/v1/sites', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const sites = await siteRes.json();
        const siteId = sites[0]?._id;

        if (!siteId) throw new Error("No sites found.");

        // 3. Get pages for the selected site
        const pageRes = await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const pages = await pageRes.json();
        const pageId = pages[0]?._id;

        if (!pageId) throw new Error("No pages found.");

        // 4. Inject theme-switcher script into custom code
        const injectRes = await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages/${pageId}/custom-code`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            head: '',
            body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
            enabled: true
          })
        });

        const result = await injectRes.json();
        console.log('✅ Script injected successfully:', result);

        // 5. Redirect to success page
        router.push('/success');
      } catch (err) {
        console.error('❌ Error for during OAuth or injection:', err);
      }
    };

    exchangeTokenAndInject();
  }, [code, router]);

  return (
    <p style={{ textAlign: 'center', marginTop: '5rem' }}>
      Exchanging code and injecting Theme Switcher...
    </p>
  );
}