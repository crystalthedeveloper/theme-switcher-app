// pages/index.js

import Head from 'next/head';
import en from '../locales/en';
import styles from './css/index.module.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const t = en;
  const [appInstalled, setAppInstalled] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const installedFromURL = urlParams.get('installed') === 'true';
    const isInDesigner = window.self !== window.top;

    if (installedFromURL || isInDesigner) {
      sessionStorage.setItem('webflow-app-installed', 'true');
    }

    const savedInstalled = sessionStorage.getItem('webflow-app-installed') === 'true';
    setAppInstalled(savedInstalled);
  }, []);

  const showFeedback = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 4000);
  };

  const handleCopyScript = () => {
    const scriptTag =
      '<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js"></script>';

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(scriptTag)
        .then(() => showFeedback('📋 Script copied! Paste it into Site Settings > Footer.'))
        .catch((err) => {
          console.error('❌ Clipboard API error:', err);
          fallbackCopy(scriptTag);
        });
    } else {
      fallbackCopy(scriptTag);
    }
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    textarea.select();
    try {
      const success = document.execCommand('copy');
      if (success) {
        showFeedback('📋 Script copied using fallback!');
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('❌ Fallback copy failed:', err);
      showFeedback('⚠️ Please copy the script manually.');
    }
    document.body.removeChild(textarea);
  };

  return (
    <div>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main role="main" className={styles['main-content']}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          className={styles.logo}
        />

        <h1 className={styles['main-heading']}>Theme Switcher</h1>

        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        {!appInstalled ? (
          <a
            href={`https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read pages:read custom_code:write`}
            aria-label="Connect Webflow app"
            rel="noopener noreferrer"
          >
            <button className={styles['main-button']}>{t.buttonInstall}</button>
          </a>
        ) : (
          <div className={styles['button-group']}>
            <button
              className={styles['main-button']}
              onClick={() =>
                showFeedback('✅ Use the Webflow Designer Extension panel to insert the script.')
              }
            >
              Add Embed
            </button>
            <button
              className={styles['main-button']}
              onClick={handleCopyScript}
            >
              Copy Script Tag
            </button>
          </div>
        )}

        <div
          className={`${styles.feedback} ${!showMessage ? styles.hidden : ''}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>

        <footer className={styles['main-footer']}>
          <p>{t.footer}</p>
        </footer>
      </main>
    </div>
  );
}