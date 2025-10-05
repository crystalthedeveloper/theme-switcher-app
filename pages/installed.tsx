// pages/installed.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from './css/app-shell.module.css';
import Logo from '../components/Logo';
import { useRouter } from 'next/router';

export default function Installed() {
  const router = useRouter();

  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');

  useEffect(() => {
    const storage = window.sessionStorage;

    const queryToken = router.query.token as string;
    const querySiteId = router.query.siteId as string;

    if (queryToken && querySiteId) {
      setToken(queryToken);
      setSiteId(querySiteId);
      setDebugMode(true);
    } else {
      const t = storage?.getItem('webflow_token') || '';
      const s = storage?.getItem('webflow_site_id') || '';

      if (t && s) {
        setToken(t);
        setSiteId(s);
      }
      const registrationStatus = storage?.getItem('webflow_last_registration');
      if (registrationStatus === 'success') {
        setAutoMessage('✅ Theme Switcher script was registered automatically.');
        storage.removeItem('webflow_last_registration');
      }
    }

    setLoaded(true);
  }, [router.query]);

  const handleInjectClick = async () => {
    if (!token || !siteId) {
      console.warn('❌ Cannot inject — missing token or siteId:', { token, siteId });
      setMessage('❌ Missing token or site ID.');
      return;
    }

    setInjecting(true);
    setMessage('');
    setAutoMessage('');

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
        <title>Theme Switcher Installed</title>
        <meta name="description" content="Theme Switcher has been successfully installed in Webflow." />
      </Head>

      <main className={styles.card} aria-busy={injecting}>
        <div className={styles.logoWrap} aria-hidden="true">
          <Logo />
        </div>
        <h1 className={styles.heading}>
          Theme Switcher
          <span className={styles.badgeInstalled}>Installed</span>
        </h1>
        <p className={styles.subheading}>
          Your Webflow site now ships with Theme Switcher. Manage credentials or refresh the script below.
        </p>

        {!loaded ? (
          <p className={styles.statusText}>Loading credentials…</p>
        ) : (
          <>
            {!token || !siteId ? (
              <p className={styles.errorMessage} role="alert" style={{ marginTop: 0 }}>
                Unable to access credentials. Open the app in Webflow or paste them manually:
              </p>
            ) : null}

            <div className={styles.inputs}>
              <input
                type="text"
                placeholder="Webflow token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <input
                type="text"
                placeholder="Site ID"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              />
            </div>

            <div className={styles.controls}>
              <button
                className={styles.buttonPrimary}
                onClick={handleInjectClick}
                disabled={injecting || !token || !siteId}
              >
                {injecting ? 'Refreshing…' : 'Re-register Theme Switcher Script'}
              </button>
            </div>
          </>
        )}

        {autoMessage && !message && (
          <p className={styles.autoMessage} role="status">
            {autoMessage}
          </p>
        )}

        {message && (
          <p className={message.startsWith('✅') ? styles.autoMessage : styles.errorMessage} role="alert">
            {message}
          </p>
        )}

        {debugMode && (
          <div className={styles.testBadge}>
            ⚙️ Debug mode active (from query string)
          </div>
        )}

        <p className={styles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
