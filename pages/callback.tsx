// pages/callback.tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');
  const hasResponded = useRef(false);

  const getStorage = () => {
    try {
      if (window.parent && window.parent !== window && window.parent.sessionStorage) {
        return window.parent.sessionStorage;
      }
    } catch (e) {
      console.warn('⚠️ Cannot access parent.sessionStorage:', e);
    }
    return window.sessionStorage;
  };

  const setErrorAndStop = (message: string) => {
    if (!hasResponded.current) {
      hasResponded.current = true;
      setError(message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !hasResponded.current) {
        console.warn('⚠️ Exchange timeout triggered');
        setErrorAndStop('Request timed out. Please try again.');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error: oauthError, error_description, test } = router.query;
    const isTest = test === 'true';
    setTestMode(isTest);

    console.log('🔍 Router query:', router.query);

    const storage = getStorage();
    ['webflow_token', 'webflow_site_id', 'webflow_app_installed', 'webflow_test_mode'].forEach(key =>
      storage.removeItem(key)
    );

    if (oauthError) {
      console.error('❌ OAuth Error from Webflow:', oauthError, '|', error_description);
      return setErrorAndStop('Authorization failed. Please try again.');
    }

    if (!code || typeof code !== 'string') {
      console.warn('⚠️ Invalid or missing `code` in query:', code);
      return setErrorAndStop('Missing or invalid authorization code.');
    }

    const exchangeToken = async () => {
      console.log('🔁 Starting token exchange with code:', code);

      // Log what you're about to send
      const debugPayload = {
        code,
      };
      console.log('📦 Payload to /api/exchange-token:', debugPayload);

      try {
        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debugPayload),
        });

        const data = await res.json();
        console.log('📬 Exchange response:', res.status, data);

        const { access_token, site_id, warning } = data;

        if (!res.ok || !access_token || !site_id) {
          console.error('❌ Token exchange failed:', data);
          throw new Error(data.error || 'Missing access token or site ID from Webflow.');
        }

        storage.setItem('webflow_token', access_token);
        storage.setItem('webflow_site_id', site_id);
        storage.setItem('webflow_app_installed', 'true');
        if (isTest) storage.setItem('webflow_test_mode', 'true');

        if (warning) console.warn('⚠️ API Warning:', warning);

        hasResponded.current = true;
        await router.replace(isTest ? '/?test=true' : '/');
      } catch (err: any) {
        console.error('❌ Exchange error:', err);
        setErrorAndStop(err?.message || 'Token exchange failed. Please try again.');
      }
    };


    exchangeToken();
  }, [router.isReady]);

  const t = en;

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }} aria-busy={loading}>
      <Logo />
      <h1>{t.connecting || 'Connecting to Webflow...'}</h1>
      <p aria-live="polite">
        {loading ? t.exchanging || 'Exchanging code...' : error || t.tryAgainFallback || 'Something went wrong.'}
      </p>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }} aria-live="assertive">
          {error}
        </p>
      )}

      {loading && <div style={{ fontSize: '2rem', marginTop: '1.5rem' }}>⏳</div>}

      {!loading && (
        <div style={{ marginTop: '2rem' }}>
          <a href="/" aria-label="Try again from the start">
            <button type="button" style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>
              ← {t.tryAgain || 'Try Again'}
            </button>
          </a>
        </div>
      )}

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          {t.testModeNotice || 'Test mode is enabled. Debug messages are shown in the console.'}
        </p>
      )}

      <Footer />
    </main>
  );
}