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
  const retriedMissingTokenRef = useRef(false);

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
        // Exchange
        const exchangeRes = await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!exchangeRes.ok) {
          const errText = await exchangeRes.text();
          const fatal = new Error('Exchange failed');
          (fatal as any).detail = errText || undefined;
          (fatal as any).__fatal = true;
          throw fatal;
        }
        const exchangeText = await exchangeRes.text();
        let exchangeJson: any = {};
        try {
          exchangeJson = exchangeText ? JSON.parse(exchangeText) : {};
        } catch (parseErr) {
          const fatal = new Error('Exchange response parse failed');
          (fatal as any).detail = parseErr;
          (fatal as any).__fatal = true;
          throw fatal;
        }
        const access_token = exchangeJson?.access_token;
        const site_id = exchangeJson?.site_id;
        const warning = exchangeJson?.warning;

        if (!access_token || !site_id) {
          if (!retriedMissingTokenRef.current) {
            retriedMissingTokenRef.current = true;
            // Retry once on next tick to avoid iframe/pre-check interference.
            setTimeout(() => {
              if (!hasResponded.current) {
                exchangeAndInject();
              }
            }, 20);
            return;
          }
          const fatal = new Error('Missing access token or site_id');
          (fatal as any).__fatal = true;
          throw fatal;
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

        // Inject
        const injectRes = await fetch('/api/inject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ siteId: site_id }),
        });

        let injectJson: any = null;
        try {
          injectJson = await injectRes.json();
        } catch (jsonErr) {
          console.warn('⚠️ Unable to parse inject response JSON', jsonErr);
        }

        if (!injectRes.ok || !injectJson?.success) {
          const fatal = new Error(injectJson?.message || 'Script registration failed');
          (fatal as any).detail = injectJson?.detail;
          (fatal as any).__fatal = true;
          throw fatal;
        }

        storage.setItem('webflow_last_registration', 'success');

        hasResponded.current = true;
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
        if (!err?.__fatal) {
          console.warn('⚠️ Ignoring non-fatal client-side warning during callback');
          return;
        }
        const message = err?.message || 'Token exchange failed.';
        const detail = err?.detail || defaultDetailFor(message);
        setErrorAndStop(message, detail);
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
