// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    console.log('🔍 Code from URL:', code);
    if (!code) return;

    const exchangeToken = async () => {
      try {
        const tokenRes = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const tokenData = await tokenRes.json();
        console.log('🔁 Token Response:', tokenData);

        if (!tokenData.access_token) {
          throw new Error('Missing access token.');
        }

        if (!tokenData.site_id) {
          throw new Error('Missing site ID. You must select a site during app installation.');
        }

        const { access_token: accessToken, site_id: siteId } = tokenData;

        const pagesRes = await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const pages = await pagesRes.json();
        console.log('📄 Pages retrieved:', pages);

        if (!Array.isArray(pages) || pages.length === 0) {
          throw new Error('No pages found for the selected site.');
        }

        const firstPage = pages[0];
        console.log('📄 Targeting first page ID:', firstPage._id);

        const customCodeRes = await fetch(
          `https://api.webflow.com/v1/sites/${siteId}/pages/${firstPage._id}/custom-code`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              head: '',
              body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
              enabled: true,
            }),
          }
        );

        if (!customCodeRes.ok) {
          const errorText = await customCodeRes.text();
          throw new Error('Failed to install script: ' + errorText);
        }

        console.log('✅ Script installed successfully.');
        router.push('/success');
      } catch (err) {
        console.error('❌ OAuth flow failed:', err.message || err);
        alert(err.message || 'Authorization failed. Please try again.');
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