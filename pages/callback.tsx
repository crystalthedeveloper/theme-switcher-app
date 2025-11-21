// pages/callback.tsx
import Head from 'next/head';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import Logo from '../components/Logo';
import shellStyles from './css/app-shell.module.css';
import styles from './css/callback.module.css';

export default function Callback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const hasResponded = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setLoading(false);
      console.warn('🛑 Error set and loading stopped:', message);
    }
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading && !hasResponded.current) {
        console.warn('⏰ Exchange timeout triggered after 15 seconds');
        setErrorAndStop('Request timed out. Please try again.');
      }
    }, 15000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
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

    const exchangeAndInject = async () => {
      try {
        const res = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        const { access_token, site_id, warning } = data;

        if (!res.ok) {
          throw new Error(data.error || 'Exchange failed');
        }
        if (!access_token || !site_id) {
          throw new Error('Missing access token or site_id');
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
        setLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const redirectUrl = isTest ? '/installed?test=true' : '/installed';
        queueMicrotask(() => {
          window.location.href = redirectUrl;
        });
        return;
      } catch (err: any) {
        console.error('❌ Exchange error:', err);
        // Only treat HTTP/response failures as fatal; ignore client-side iframe warnings/noise.
        const message = err?.message || '';
        const networkFailure =
          message.toLowerCase().includes('exchange failed') ||
          message.toLowerCase().includes('missing access token') ||
          message.toLowerCase().includes('script registration failed');
        if (!networkFailure) {
          console.warn('⚠️ Ignoring non-fatal client-side warning during callback');
          return;
        }
        const detail = err?.detail || defaultDetailFor(message);
        setErrorAndStop(message || 'Token exchange failed.', detail);
      }
    };

    exchangeAndInject();
  }, [router.isReady]);

  const t = en;

  const statusVariant = useMemo(() => {
    if (!loading && error) return 'warning';
    if (!loading && !error) return 'success';
    return undefined;
  }, [loading, error]);

  if (hasResponded.current) return null;

  return (
    <div className={shellStyles.shell}>
      <Head>
        <title>{t.connecting || 'Connecting to Webflow...'}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={shellStyles.card} aria-busy={loading}>
        <div className={shellStyles.logoWrap} aria-hidden="true">
          <Logo />
        </div>

        <h1 className={shellStyles.heading}>{t.connecting || 'Connecting to Webflow...'}</h1>

        <p className={shellStyles.statusText} aria-live="polite" data-variant={statusVariant}>
          {loading ? t.exchanging || 'Exchanging code...' : error || t.tryAgainFallback || 'Something went wrong.'}
        </p>

        {!loading && errorDetail && (
          <p className={shellStyles.errorMessage} role="alert">
            {errorDetail}
          </p>
        )}

        {loading ? (
          <div className={styles.spinner} aria-hidden="true" />
        ) : (
          <div className={styles.tryAgain}>
            <a href="/" aria-label="Try again from the start">
              <button type="button" className={shellStyles.buttonPrimary}>
                ← {t.tryAgain || 'Try Again'}
              </button>
            </a>
          </div>
        )}

        {testMode && (
          <div className={shellStyles.testBadge}>
            🧪 {t.testModeNotice || 'Test mode is enabled. Debug messages are shown in the console.'}
          </div>
        )}

        <p className={shellStyles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
