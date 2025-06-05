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
      alert('Authorization was cancelled or denied. You can try again anytime.');
      router.push('/');
      return;
    }

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

        if (warning) {
          console.warn('⚠️ Warning:', warning);
        }

        if (!sites.length) {
          alert('No hosted Webflow sites found. Please make sure your site is on a paid plan.');
          throw new Error('No valid site returned.');
        }

        console.log('🔓 Access token received. Redirecting to site selection...');
        router.push(`/select-site?token=${access_token}`);

      } catch (err) {
        console.error('❌ Callback Error:', err);
        alert(err.message || 'Something went wrong during installation.');
        router.push('/');
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