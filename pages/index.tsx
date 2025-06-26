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

  // State: Auth, Injecting, Messages, and Token Info
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');

  // On load: Check for stored OAuth token and site ID
  useEffect(() => {
    let storage = sessionStorage;
    try {
      if (window.parent && window.parent !== window && window.parent.sessionStorage) {
        storage = window.parent.sessionStorage;
      }
    } catch (err) {}

    const savedToken = storage.getItem('webflow_token');
    const savedSiteId = storage.getItem('webflow_site_id');
    const installed = storage.getItem('webflow_app_installed') === 'true';

    setToken(savedToken || '');
    setSiteId(savedSiteId || '');
    const authorized = !!savedToken && !!savedSiteId && installed;
    setIsAuthorized(authorized);

    if (authorized && router.pathname !== '/installed') {
      router.replace('/installed');
    }
  }, []);

  // OAuth authorization URL
  const authURL = `https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read custom_code:write`;

  // Inject script into Webflow Footer using REST API
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

      <main className={styles['main-content']}>
        <Logo />
        <h1 className={styles['main-heading']}>
          Theme Switcher
          {isAuthorized && <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>}
        </h1>
        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        {!isAuthorized ? (
          <a href={authURL}>
            <button className={styles['main-button']}>{t.buttonInstall || 'Install App'}</button>
          </a>
        ) : (
          <>
            <button className={styles['main-button']} onClick={handleInjectClick} disabled={injecting}>
              {injecting ? 'Injecting…' : 'Inject Script to Webflow Footer'}
            </button>
            {message && (
              <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>
            )}
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}