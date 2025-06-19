// pages/callback.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 15000); // 15 seconds

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error: oauthError, error_description, test } = router.query;
    const isTest = test === 'true';
    setTestMode(isTest);

    if (oauthError) {
      if (isTest) console.error('❌ OAuth Error:', error_description || oauthError);
      setError('Authorization failed. Please try again.');
      setLoading(false);
      return;
    }

    if (!code || typeof code !== 'string') {
      setError('Missing or invalid authorization code.');
      setLoading(false);
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

        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          if (isTest) console.error('❌ Failed to parse JSON:', jsonError);
          throw new Error('Invalid response from server. Please try again.');
        }

        if (isTest) console.log('📬 Response from /api/exchange-token:', data);

        if (!res.ok || !data.access_token || !data.site_id) {
          if (isTest) console.error('⚠️ Token exchange failed:', data);
          throw new Error(data.error || 'Missing access token or site ID from Webflow. Please reauthorize.');
        }

        const { access_token, warning, site_id } = data;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('webflow_token', access_token);
          sessionStorage.setItem('webflow_site_id', site_id);
          if (testMode) sessionStorage.setItem('webflow_test_mode', 'true');
        }

        if (testMode) {
          if (access_token) console.log('✅ Received access token:', access_token.slice(0, 8) + '...');
          if (warning) console.warn('⚠️ Warning:', warning);
        }

        const redirectUrl = `/confirm?site_id=${site_id}&token=${access_token}${testMode ? '&test=true' : ''}`;
        if (testMode) console.log('➡️ Redirecting to:', redirectUrl);
        router.replace(redirectUrl);
      } catch (err) {
        console.error('❌ Token exchange error:', err);
        setLoading(false);
        const message =
          typeof err === 'string'
            ? err
            : err?.message || 'Token exchange failed. Please try again.';
        setError(message);
      }
    };

    exchangeToken();
  }, [router.isReady, router.query]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }} aria-busy={loading}>
      <h1>{en.connecting}</h1>

      <p aria-live="polite">
        {loading
          ? en.exchanging
          : error || en.tryAgainFallback}
      </p>

      {error && <p style={{ color: 'red', marginTop: '1rem' }} aria-live="assertive">{error}</p>}

      {loading && (
        <div style={{ fontSize: '2rem', marginTop: '1.5rem' }}>
          ⏳
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: '2rem' }}>
          <a href="/" aria-label="Try again from the start">
            <button
              type="button"
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: '2px solid transparent',
                outlineOffset: '2px',
              }}
            >
              ← {en.tryAgain}
            </button>
          </a>
        </div>
      )}

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          {en.testModeNotice}
        </p>
      )}
    </main>
  );
}