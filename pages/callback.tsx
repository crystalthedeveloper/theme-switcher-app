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

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code') || '';
    const oauthError = url.searchParams.get('error') || '';
    const error_description = url.searchParams.get('error_description') || '';
    const isTest = url.searchParams.get('test') === 'true';

    setTestMode(isTest);

    if (oauthError) {
      return setErrorAndStop('Authorization failed. ' + error_description);
    }

    if (!code) {
      return setErrorAndStop('Missing or invalid authorization code.');
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
          throw new Error(data.error || 'Exchange failed');
        }

        // Inject script that saves credentials + redirects
        const redirectUrl = isTest
          ? `/installed?test=true&token=${access_token}&siteId=${site_id}`
          : `/installed?token=${access_token}&siteId=${site_id}`;

        document.body.innerHTML = `
          <script>
            sessionStorage.setItem('webflow_token', '${access_token}');
            sessionStorage.setItem('webflow_site_id', '${site_id}');
            sessionStorage.setItem('webflow_app_installed', 'true');
            ${isTest ? "sessionStorage.setItem('webflow_test_mode', 'true');" : ''}
            window.location.href = '${redirectUrl}';
          </script>
        `;
      } catch (err: any) {
        console.error('❌ Exchange error:', err);
        setErrorAndStop(err?.message || 'Token exchange failed.');
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