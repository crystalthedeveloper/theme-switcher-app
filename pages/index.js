// pages/index.js

import Head from 'next/head';
import en from '../locales/en';
import styles from './css/index.module.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const t = en;
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const installed = urlParams.get('installed') === 'true';
    if (installed) {
      sessionStorage.setItem('webflow-app-installed', 'true');
    }
    const savedInstalled = sessionStorage.getItem('webflow-app-installed') === 'true';
    setAppInstalled(savedInstalled);
  }, []);

  return (
    <div>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={en.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main role="main" className={styles['main-content']}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          role="img"
          aria-label="Logo of Crystal The Developer"
          className={styles.logo}
        />

        <h1 className={styles['main-heading']}>Theme Switcher</h1>

        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        <a
          href={`https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read pages:read custom_code:write`}
          aria-label="Authorize with Webflow and connect this app"
          rel="noopener noreferrer"
        >
          <button
            type="button"
            className={styles['main-button']}
          >
            {en.buttonInstall}
          </button>
        </a>

        {appInstalled && (
          <div className={styles['button-group']}>
            <button
              type="button"
              className={styles['main-button']}
              onClick={() => alert('Embed Script Added')}
            >
              Add Embed
            </button>
            <button
              type="button"
              className={styles['main-button']}
              onClick={() => navigator.clipboard.writeText('<script src="..."></script>')}
            >
              Copy Script Tag
            </button>
          </div>
        )}

        <footer className={styles['main-footer']}>
          <p>{en.footer}</p>
        </footer>
      </main>
    </div>
  );
}