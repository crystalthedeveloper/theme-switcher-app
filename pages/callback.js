// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error, error_description, test } = router.query;
    const isTest = test === 'true';
    setTestMode(isTest);

    if (error) {
      if (isTest) console.error('❌ OAuth Error:', error_description || error);
      router.replace('/');
      return;
    }

    if (!code) return;

    const exchangeToken = async () => {
      try {
        if (isTest) console.log('🔄 Exchanging code for token:', code);

        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok || !data.access_token) {
          if (isTest) console.error('⚠️ Token exchange failed:', data);
          throw new Error(data.error || 'Token exchange failed.');
        }

        const { access_token, sites = [], warning } = data;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('webflow_token', access_token);
        }

        if (isTest) {
          console.log('✅ Access token:', access_token);
          if (warning) console.warn('⚠️ Warning:', warning);
        }

        if (!sites.length) {
          if (isTest) console.warn('⚠️ No hosted sites found. Redirecting to manual install.');
          router.replace('/success?manual=true');
          return;
        }

        const redirectUrl = `/select-site?token=${access_token}${isTest ? '&test=true' : ''}`;
        if (isTest) console.log('➡️ Redirecting to:', redirectUrl);
        router.replace(redirectUrl);
      } catch (err) {
        if (isTest) console.error('❌ Unexpected error:', err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [router.isReady, router.query]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>🔄 Connecting to Webflow...</h1>
      <p>
        {loading
          ? 'Exchanging code and preparing your site list...'
          : 'Something went wrong. Redirecting...'}
      </p>
      {testMode && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode active – extra logs visible in browser console
        </p>
      )}
    </main>
  );
}