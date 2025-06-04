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

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token || !tokenData.site_id) {
          console.error('⚠️ Token error:', tokenData);
          throw new Error(tokenData.error || 'Token exchange failed. Missing access token or site ID.');
        }

        const { access_token, site_id, sites = [] } = tokenData;
        const siteName = sites.find((s) => s.id === site_id)?.name || site_id;
        console.log(`🔐 Authorized site: ${siteName}`);

        // Step 1: Fetch pages from REST API
        const pagesRes = await fetch(`https://api.webflow.com/rest/sites/${site_id}/pages`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'accept-version': '1.0.0',
          },
        });

        const pagesData = await pagesRes.json();
        const pageArray = pagesData?.pages || pagesData;

        if (!Array.isArray(pageArray) || pageArray.length === 0) {
          throw new Error('No pages returned from /rest/sites/:id/pages');
        }

        const firstPage = pageArray[0];
        console.log(`📄 Injecting script into: ${firstPage.name || firstPage._id}`);

        // Step 2: Inject script via REST API
        const injectRes = await fetch(
          `https://api.webflow.com/rest/sites/${site_id}/pages/${firstPage._id}/custom-code`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
              'accept-version': '1.0.0',
            },
            body: JSON.stringify({
              body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
              enabled: true,
            }),
          }
        );

        if (!injectRes.ok) {
          const errorText = await injectRes.text();
          console.error('❌ Injection failed:', errorText);
          throw new Error('Failed to inject theme switcher script.');
        }

        console.log('✅ Script successfully installed.');
        router.push('/success');

      } catch (err) {
        console.error('❌ Callback Error:', err);
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