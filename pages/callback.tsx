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
  const [errorDetail, setErrorDetail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const hasResponded = useRef(false);

  const defaultDetailFor = (message: string) => {
    if (!message) {
      return 'Please try again or contact support if the issue continues.';
    }

    const normalized = message.toLowerCase();

    if (normalized.includes('script registration') || normalized.includes('inject footer')) {
      return 'Webflow could not update your Custom Code settings. Confirm the site has Custom Code access (paid plan) and that the Theme Switcher app still has permission.';
    }

    if (normalized.includes('token exchange')) {
      return 'Please confirm your Webflow credentials and try again.';
    }

    if (normalized.includes('authorization')) {
      return 'Return to the Webflow App panel to restart the install when you are ready.';
    }

    return 'Please try again or contact support if the issue continues.';
  };

  const setErrorAndStop = (message: string, detail = '') => {
    if (!hasResponded.current) {
      hasResponded.current = true;
      setError(message);
      setErrorDetail(detail || defaultDetailFor(message));
      setStatusMessage('');
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
      const userCancelled = oauthError === 'access_denied';
      const friendlyMessage = userCancelled
        ? 'Authorization canceled — Theme Switcher was not connected.'
        : 'Authorization failed.';
      const friendlyDetail = userCancelled
        ? 'No changes were made to your Webflow site. To finish installing later, return to Webflow and approve the Theme Switcher permissions. You can close this tab safely if you changed your mind.'
        : error_description || 'Webflow returned an error. Please try again.';

      return setErrorAndStop(friendlyMessage, friendlyDetail);
    }

    if (!code) {
      return setErrorAndStop('Missing or invalid authorization code.', 'Please restart the install from the Webflow App panel.');
    }

    const exchangeToken = async () => {
      try {
        setStatusMessage('Contacting Webflow…');
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

        const storage = window.sessionStorage;
        storage.setItem('webflow_token', access_token);
        storage.setItem('webflow_site_id', site_id);
        storage.setItem('webflow_app_installed', 'true');
        if (isTest) {
          storage.setItem('webflow_test_mode', 'true');
        }

        if (warning) {
          console.warn('⚠️ Webflow warning:', warning);
        }

        setStatusMessage('Registering Theme Switcher in Webflow…');
        const injectResponse = await fetch('/api/inject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ siteId: site_id }),
        });

        let injectData: any = null;
        try {
          injectData = await injectResponse.json();
        } catch (jsonErr) {
          console.warn('⚠️ Unable to parse inject response JSON', jsonErr);
        }

        if (!injectResponse.ok || !injectData?.success) {
          const error = new Error(injectData?.message || 'Script registration failed');
          (error as any).detail = injectData?.detail;
          throw error;
        }

        storage.setItem('webflow_last_registration', 'success');

        hasResponded.current = true;
        setStatusMessage('Finishing setup…');

        const redirectUrl = isTest
          ? `/installed?test=true`
          : `/installed`;

        router.replace(redirectUrl);
      } catch (err: any) {
        console.error('❌ Exchange error:', err);
        const message = err?.message || 'Token exchange failed.';
        const detail = err?.detail || defaultDetailFor(message);
        setErrorAndStop(message, detail);
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
        {loading
          ? statusMessage || t.exchanging || 'Exchanging code...'
          : error || t.tryAgainFallback || 'Something went wrong.'}
      </p>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }} aria-live="assertive">
          {errorDetail || error}
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
