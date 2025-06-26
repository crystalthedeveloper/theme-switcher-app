// pages/index.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import en from '../locales/en';
import styles from './css/index.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Home() {
  const t = en;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [storage, setStorage] = useState<Storage | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let resolvedStorage: Storage = window.sessionStorage;

      try {
        if (window.parent && window.parent !== window && window.parent.sessionStorage) {
          resolvedStorage = window.parent.sessionStorage;
        }
      } catch (e) {
        console.warn('Fallback to parent.sessionStorage failed:', e);
      }

      setStorage(resolvedStorage);

      const savedToken = resolvedStorage.getItem('webflow_token');
      const savedSiteId = resolvedStorage.getItem('webflow_site_id');
      const appInstalled = resolvedStorage.getItem('webflow_app_installed');

      setToken(savedToken || '');
      setSiteId(savedSiteId || '');

      setIsAuthorized(Boolean(savedToken && savedSiteId && appInstalled));
    }
  }, []);

  const authURL = `https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read custom_code:write`;

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

      if (data.success) {
        setMessage('✅ Script injected into Webflow Footer!');
      } else {
        setMessage(data.message || data.error || '❌ Injection failed');
      }
    } catch (err) {
      console.error('❌ Injection error:', err);
      setMessage('❌ Error injecting script. Try again.');
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

      <main role="main" className={styles['main-content']}>
        <Logo />

        <h1 className={styles['main-heading']}>
          Theme Switcher
          {isAuthorized && <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>}
        </h1>

        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        {!isAuthorized ? (
          <a href={authURL} aria-label="Connect Webflow app" rel="noopener noreferrer">
            <button className={styles['main-button']}>{t.buttonInstall || 'Install Theme Switcher'}</button>
          </a>
        ) : (
          <>
            <button
              className={styles['main-button']}
              onClick={handleInjectClick}
              disabled={injecting}
              style={{ marginTop: '1rem' }}
            >
              {injecting ? 'Injecting…' : 'Inject Script to Webflow Footer'}
            </button>

            {message && (
              <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
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
