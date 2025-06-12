// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error, error_description } = router.query;

    // Handle user canceling authorization
    if (error) {
      console.error('❌ OAuth Error:', error_description || error);
      router.replace('/');
      return;
    }

    // Wait until `code` is present in the query
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

        if (!tokenRes.ok || !tokenData.access_token) {
          console.error('⚠️ Token error:', tokenData);
          throw new Error(tokenData.error || 'Token exchange failed.');
        }

        const { access_token, sites = [], warning } = tokenData;

        // Save token in sessionStorage for re-use
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('webflow_token', access_token);
        }

        if (warning) {
          console.warn('⚠️ Warning:', warning);
        }

        if (!sites.length) {
          console.warn('⚠️ No hosted Webflow sites found. Skipping to manual install.');
          router.replace('/success?manual=true');
          return;
        }

        console.log('✅ Token received. Redirecting to site selection...');
        router.replace(`/select-site?token=${access_token}`);
        console.log('🎉 Redirect to /select-site complete.');
      } catch (err) {
        console.error('❌ Callback Error:', err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [router.isReady, router.query]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem' }}>
      {loading ? (
        <p>Exchanging code and preparing your sites...</p>
      ) : (
        <p style={{ color: 'red' }}>Something went wrong. Redirecting...</p>
      )}
    </main>
  );
}