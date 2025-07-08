// pages/index.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import styles from './css/index.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Home() {
  const t = en;
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [loaded, setLoaded] = useState(false);

  const getStorage = () => {
    try {
      if (window.parent && window.parent !== window && window.parent.sessionStorage) {
        return window.parent.sessionStorage;
      }
    } catch (err) {
      console.warn('⚠️ Could not access parent.sessionStorage:', err);
    }
    return window.sessionStorage;
  };

  useEffect(() => {
    const storage = getStorage();

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

  const authURL = (() => {
    const base = `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=custom_code:read custom_code:write sites:read sites:write pages:read pages:write authorized_user:read`;
    return redirectUri ? `${base}&redirect_uri=${encodeURIComponent(redirectUri)}` : base;
  })();

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
      setMessage(data.success ? '✅ Script injected!' : `❌ ${data.message || 'Injection failed'}`);
    } catch (err) {
      console.error('❌ Injection error:', err);
      setMessage('❌ Script injection error.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles['main-content']} aria-busy={injecting}>
        <Logo />
        <h1 className={styles['main-heading']}>
          Theme Switcher
          {isAuthorized && <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>}
        </h1>
        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        {!loaded ? (
          <p style={{ fontStyle: 'italic' }}>Loading…</p>
        ) : !isAuthorized ? (
          <>
            {console.log('🔐 Final OAuth URL:', authURL)}
            <a href={authURL}>
              <button className={styles['main-button']} disabled={!authURL}>
                {t.buttonInstall || 'Install App'}
              </button>
            </a>
          </>
        ) : (
          <>
            <button
              className={styles['main-button']}
              onClick={handleInjectClick}
              disabled={injecting || !token || !siteId}
            >
              {injecting ? 'Injecting…' : 'Inject Script to Webflow Footer'}
            </button>
            {message && (
              <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }} role="alert">
                {message}
              </p>
            )}
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}