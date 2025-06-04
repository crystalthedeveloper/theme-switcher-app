// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    if (!code) return;

    const exchangeToken = async () => {
      try {
        console.log('🔄 Exchanging code for token:', code);

        const tokenRes = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) {
          const errorText = await tokenRes.text();
          throw new Error(`Token exchange failed: ${errorText}`);
        }

        const tokenData = await tokenRes.json();
        console.log('🔁 Token data:', tokenData);

        const accessToken = tokenData.access_token;
        const siteId = tokenData.site_id;

        if (!accessToken || !siteId) {
          throw new Error('Missing access token or site ID.');
        }

        // Step 1: Fetch pages
        const pagesRes = await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'accept-version': '1.0.0',
          },
        });

        const pages = await pagesRes.json();
        if (!Array.isArray(pages) || pages.length === 0) {
          throw new Error('No pages found for this site.');
        }

        const firstPage = pages[0];

        // Step 2: Inject script
        const injectRes = await fetch(
          `https://api.webflow.com/v1/sites/${siteId}/pages/${firstPage._id}/custom-code`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'accept-version': '1.0.0',
            },
            body: JSON.stringify({
              head: '',
              body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
              enabled: true,
            }),
          }
        );

        if (!injectRes.ok) {
          const error = await injectRes.text();
          console.error('❌ Injection failed:', error);
          throw new Error('Failed to inject theme switcher script.');
        }

        console.log('✅ Script successfully installed.');
        router.push('/success');

      } catch (err) {
        console.error('❌ Callback error:', err.message || err);
        alert(err.message || 'Something went wrong during installation.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [router.isReady, router.query.code]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem' }}>
      {loading ? (
        <p>Exchanging code and installing script...</p>
      ) : (
        <p style={{ color: 'red' }}>Something went wrong. Redirecting...</p>
      )}
    </main>
  );
}