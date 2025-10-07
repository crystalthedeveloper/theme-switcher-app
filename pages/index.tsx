// pages/index.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import styles from './css/app-shell.module.css';
import Logo from '../components/Logo';

export default function Home() {
  const t = en;
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storage = window.sessionStorage;

    const savedToken = storage.getItem('webflow_token') || '';
    const savedSiteId = storage.getItem('webflow_site_id') || '';
    const installed = storage.getItem('webflow_app_installed') === 'true';
    const authorized = !!savedToken && !!savedSiteId && installed;

    const query = new URLSearchParams(window.location.search);
    const code = query.get('code');

    setToken(savedToken);
    setSiteId(savedSiteId);
    setIsAuthorized(authorized);
    setLoaded(true);

    if (code) {
      console.log('🧭 Found code in query — redirecting to /callback...');
      router.replace(`/callback?code=${code}`);
    } else if (authorized && router.pathname !== '/installed') {
      console.log('✅ Authorized — redirecting to /installed...');
      router.replace('/installed');
    } else {
      console.log('🚫 Not authorized yet. Showing install option.');
    }
  }, [router]);

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI;

  const authURL = `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=custom_code:read custom_code:write sites:read sites:write pages:read pages:write authorized_user:read${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`;

  const handleInjectClick = async () => {
    setInjecting(true);
    setMessage('');

    try {
      const res = await fetch('/api/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ siteId }),
      });

      const data = await res.json();
      setMessage(data.success ? '✅ Theme Switcher script refreshed!' : `❌ ${data.message || 'Injection failed'}`);
    } catch (err) {
      console.error('❌ Injection error:', err);
      setMessage('❌ Script injection error.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className={styles.shell}>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.card} aria-busy={injecting}>
        <div className={styles.logoWrap} aria-hidden="true">
          <Logo />
        </div>
        <h1 className={styles.heading}>
          Theme Switcher
          {isAuthorized && <span className={styles.badgeInstalled}>Installed</span>}
        </h1>
        <p className={styles.subheading}>
          Let your visitors switch between dark and light mode, no custom code edits required.
        </p>

        {!loaded ? (
          <p className={styles.statusText}>Loading…</p>
        ) : !isAuthorized ? (
          <div className={styles.controls}>
            <a href={authURL}>
              <button className={styles.buttonPrimary} disabled={!authURL}>
                {t.buttonInstall || 'Install App'}
              </button>
            </a>
          </div>
        ) : (
          <>
            <p className={styles.subheading} style={{ maxWidth: '460px', marginBottom: '1.5rem' }}>
              The Theme Switcher script is registered automatically after install. Use the button below if you need to refresh it manually.
            </p>
            <div className={styles.controls}>
              <button
                className={styles.buttonPrimary}
                onClick={handleInjectClick}
                disabled={injecting || !token || !siteId}
              >
                {injecting ? 'Refreshing…' : 'Re-register Theme Switcher Script'}
              </button>
            </div>
            {message && (
              <p
                className={message.startsWith('✅') ? styles.autoMessage : styles.errorMessage}
                role="alert"
              >
                {message}
              </p>
            )}
          </>
        )}

        <p className={styles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
