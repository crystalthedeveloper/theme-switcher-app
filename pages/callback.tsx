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
      console.warn('🛑 Error set and loading stopped:', message);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !hasResponded.current) {
        console.warn('⏰ Exchange timeout triggered after 15 seconds');
        setErrorAndStop('Request timed out. Please try again.');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!router.isReady) return;

    // ✅ Try reading from router.query first
    let code = router.query.code as string;
    let oauthError = router.query.error as string;
    let error_description = router.query.error_description as string;
    let isTest = router.query.test === 'true';

    // 🧯 Fallback to URL parsing if router.query is missing (Webflow iframe bug)
    if (!code) {
      const url = new URL(window.location.href);
      code = url.searchParams.get('code') || '';
      oauthError = oauthError || url.searchParams.get('error') || '';
      error_description = error_description || url.searchParams.get('error_description') || '';
      isTest = isTest || url.searchParams.get('test') === 'true';
    }

    setTestMode(isTest);

    console.log('🔍 Final resolved query values:', { code, oauthError, error_description, isTest });

    const storage = getStorage();
    if (!storage) {
      console.error('🚫 Session storage not available');
      return setErrorAndStop('Storage is unavailable. Please try again in a supported browser.');
    }

    ['webflow_token', 'webflow_site_id', 'webflow_app_installed', 'webflow_test_mode'].forEach(key => {
      console.log(`🧹 Clearing storage key: ${key}`);
      storage.removeItem(key);
    });

    if (oauthError) {
      console.error('❌ OAuth error from Webflow:', oauthError, '|', error_description);
      return setErrorAndStop('Authorization failed. Please try again.');
    }

    if (!code || typeof code !== 'string') {
      console.warn('⚠️ Missing or invalid code:', code);
      return setErrorAndStop('Missing or invalid authorization code.');
    }

    const exchangeToken = async () => {
      console.log('🔁 Attempting token exchange with code:', code);
      const payload = { code };
      console.log('📦 Sending payload to /api/exchange-token:', payload);

      try {
        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log('📬 Response from /api/exchange-token:', res.status, data);

        const { access_token, site_id, warning } = data;

        if (!res.ok || !access_token || !site_id) {
          console.error('❌ Token exchange failed:', data);
          throw new Error(data.error || 'Missing access token or site ID from Webflow.');
        }

        console.log('🔐 Access token and site ID obtained:', { access_token, site_id });

        storage.setItem('webflow_token', access_token);
        storage.setItem('webflow_site_id', site_id);
        storage.setItem('webflow_app_installed', 'true');
        if (isTest) storage.setItem('webflow_test_mode', 'true');

        if (warning) {
          console.warn('⚠️ API warning during exchange:', warning);
        }

        hasResponded.current = true;
        const destination = isTest ? '/installed?test=true' : '/installed';
        console.log('🚀 Redirecting to:', destination);
        await router.replace(destination);
      } catch (err: any) {
        console.error('🔥 Error during token exchange:', err);
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