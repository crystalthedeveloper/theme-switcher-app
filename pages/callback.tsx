// Token exchange – handles OAuth callback and token exchange with Webflow
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !hasResponded.current) {
        console.warn('⚠️ Exchange timeout triggered');
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

    console.log('🔍 Router query:', router.query);

    const storage = getStorage();
    ['webflow_token', 'webflow_site_id', 'webflow_app_installed', 'webflow_test_mode'].forEach(key =>
      storage.removeItem(key)
    );

    if (oauthError) {
      console.error('❌ OAuth Error from Webflow:', oauthError, '| Description:', error_description);
      if (!hasResponded.current) {
        hasResponded.current = true;
        setError('Authorization failed. Please try again.');
        setLoading(false);
      }
      return;
    }

    if (!code || typeof code !== 'string') {
      console.warn('⚠️ Invalid or missing `code` in query:', code);
      if (!hasResponded.current) {
        hasResponded.current = true;
        setError('Missing or invalid authorization code.');
        setLoading(false);
      }
      return;
    }

    const exchangeToken = async () => {
      console.log('🔁 Starting token exchange with code:', code);

      try {
        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        console.log('📡 Exchange response status:', res.status);

        const data = await res.json();
        console.log('📬 Exchange response body:', data);

        const { access_token, site_id, warning } = data;

        if (!res.ok || !access_token || !site_id) {
          console.error('❌ Token exchange failed with data:', data);
          throw new Error(data.error || 'Missing access token or site ID.');
        }

        console.log('✅ Token and Site ID received:', { access_token, site_id });

        storage.setItem('webflow_token', access_token);
        storage.setItem('webflow_site_id', site_id);
        storage.setItem('webflow_app_installed', 'true');
        if (isTest) storage.setItem('webflow_test_mode', 'true');

        if (warning) console.warn('⚠️ API Warning:', warning);

        hasResponded.current = true;
        await router.replace(`/${isTest ? '?test=true' : ''}`);
      } catch (err: any) {
        console.error('❌ Error during token exchange:', err);
        if (!hasResponded.current) {
          hasResponded.current = true;
          setError(err?.message || 'Token exchange failed. Please try again.');
          setLoading(false);
        }
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