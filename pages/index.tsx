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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = sessionStorage.getItem('webflow_token');
      const savedSiteId = sessionStorage.getItem('webflow_site_id');

      setToken(savedToken || '');
      setSiteId(savedSiteId || '');

      setIsAuthorized(Boolean(savedToken && savedSiteId));
    }
  }, []);

  const authURL = `https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read custom_code:write`;

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
          {isAuthorized && (
            <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>
          )}
        </h1>

        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        {!isAuthorized ? (
          <a href={authURL} aria-label="Connect Webflow app" rel="noopener noreferrer">
            <button className={styles['main-button']}>{t.buttonInstall}</button>
          </a>
        ) : (
          <a
            href="https://webflow.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Webflow Designer"
          >
            <button className={styles['main-button']} style={{ marginTop: '1rem' }}>
              Inject Script in Webflow Designer →
            </button>
          </a>
        )}

        <Footer />
      </main>
    </div>
  );
}