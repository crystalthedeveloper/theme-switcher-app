// pages/callback.tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import Logo from '../components/Logo';
import styles from './css/callback.module.css';

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

    const storage = getStorage();
    ['webflow_token', 'webflow_site_id', 'webflow_app_installed', 'webflow_test_mode'].forEach(key =>
      storage.removeItem(key)
    );

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
        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        const { access_token, site_id, warning } = data;

        if (!res.ok || !access_token || !site_id) {
          throw new Error(data.error || 'Missing access token or site ID.');
        }

        if (isTest) {
          console.log('✅ Saving to sessionStorage:', { access_token, site_id });
        }

        storage.setItem('webflow_token', access_token);
        storage.setItem('webflow_site_id', site_id);
        storage.setItem('webflow_app_installed', 'true');
        if (isTest) storage.setItem('webflow_test_mode', 'true');

        if (warning) console.warn('⚠️ Warning:', warning);

        hasResponded.current = true;

        // Redirect back to homepage or with test param
        await router.replace(`/${isTest ? '?test=true' : ''}`);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err: any) {
        console.error('❌ Token exchange error:', err);
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

      <footer className={styles['main-footer']}>
        <p>{t.footer || 'Theme Switcher by Crystal'}</p>
      </footer>
    </main>
  );
}