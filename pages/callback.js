// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error, error_description, test } = router.query;
    const isTest = test === 'true';
    setTestMode(isTest);

    if (error) {
      if (isTest) console.error('❌ OAuth Error:', error_description || error);
      router.replace(`/install${isTest ? '?test=true' : ''}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      if (isTest) console.warn('⚠️ Missing or invalid code.');
      return;
    }

    const exchangeToken = async () => {
      try {
        if (isTest) console.log('🔄 Exchanging code for token:', code);
        if (isTest) console.log('📦 Sending payload:', JSON.stringify({ code }));

        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (isTest) console.log('📬 Response from /api/exchange-token:', data);

        if (!res.ok || !data.access_token) {
          if (isTest) {
            console.error('⚠️ Token exchange failed:');
            console.log('🔍 Full response object:', data);
          }
          throw new Error(data.error || 'Token exchange failed.');
        }

        const { access_token, warning } = data;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('webflow_token', access_token);
        }

        if (testMode) {
          console.log('✅ Received access token:', access_token.slice(0, 8) + '...');
          if (warning) console.warn('⚠️ Warning:', warning);
        }

        const redirectUrl = `/select-site?token=${access_token}${testMode ? '&test=true' : ''}`;
        if (testMode) console.log('➡️ Redirecting to:', redirectUrl);
        router.replace(redirectUrl);
      } catch (err) {
        console.error('❌ Token exchange error:', err);
        setLoading(false);
        setError('Token exchange failed. Please try again.');
      }
    };

    exchangeToken();
  }, [router.isReady, router.query]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }} aria-busy={loading}>
      <h1>🔄 Connecting to Webflow...</h1>

      <p>
        {loading
          ? 'Exchanging code and preparing your site list...'
          : 'Something went wrong. Please try again from the Install page.'}
      </p>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {loading && (
        <div style={{ fontSize: '2rem', marginTop: '1.5rem' }}>
          ⏳
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: '2rem' }}>
          <a href="/install" aria-label="Try OAuth install again">
            <button
              type="button"
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              ← Try Again
            </button>
          </a>
        </div>
      )}

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode enabled – debug logs are visible in your console
        </p>
      )}
    </main>
  );
}