// pages/callback.js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');
  const hasResponded = useRef(false); // ✅ prevent double state changes

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !hasResponded.current) {
        hasResponded.current = true;
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error: oauthError, error_description, test } = router.query;
    const isTest = test === 'true';
    setTestMode(isTest);

    // Clean up
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('webflow_token');
      sessionStorage.removeItem('webflow_site_id');
      sessionStorage.removeItem('webflow_app_installed');
    }

    if (oauthError) {
      if (isTest) console.error('❌ OAuth Error:', error_description || oauthError);
      if (!hasResponded.current) {
        hasResponded.current = true;
        setError('Authorization failed. Please try again.');
        setLoading(false);
      }
      return;
    }

    if (!code || typeof code !== 'string') {
      if (isTest) console.warn('⚠️ Missing or invalid code.');
      if (!hasResponded.current) {
        hasResponded.current = true;
        setError('Missing or invalid authorization code.');
        setLoading(false);
      }
      return;
    }

    const exchangeToken = async () => {
      try {
        if (isTest) console.log('🔄 Exchanging code for token:', code);

        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const raw = await res.text();
        let data;

        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error('Unexpected response format from server.');
        }

        if (!res.ok || !data.access_token || !data.site_id) {
          if (isTest) console.error('⚠️ Token exchange failed:', data);
          throw new Error(data.error || 'Missing access token or site ID.');
        }

        const { access_token, site_id, warning } = data;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('webflow_token', access_token);
          sessionStorage.setItem('webflow_site_id', site_id);
          sessionStorage.setItem('webflow_app_installed', 'true');
          if (testMode) sessionStorage.setItem('webflow_test_mode', 'true');
        }

        if (isTest && warning) console.warn('⚠️ Warning:', warning);

        hasResponded.current = true;
        router.replace(`/select-site${testMode ? '?test=true' : ''}`);
      } catch (err) {
        console.error('❌ Token exchange error:', err);
        if (!hasResponded.current) {
          hasResponded.current = true;
          setLoading(false);
          setError(err?.message || 'Token exchange failed. Please try again.');
        }
      }
    };

    exchangeToken();
  }, [router.isReady]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }} aria-busy={loading}>
      <h1>{en.connecting}</h1>
      <p aria-live="polite">{loading ? en.exchanging : error || en.tryAgainFallback}</p>

      {error && <p style={{ color: 'red', marginTop: '1rem' }} aria-live="assertive">{error}</p>}
      {loading && <div style={{ fontSize: '2rem', marginTop: '1.5rem' }}>⏳</div>}

      {!loading && (
        <div style={{ marginTop: '2rem' }}>
          <a href="/" aria-label="Try again from the start">
            <button type="button" style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>
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