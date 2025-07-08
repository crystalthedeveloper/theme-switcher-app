// pages/installed.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from './css/index.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';

export default function Installed() {
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const router = useRouter();

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
    const t = storage?.getItem('webflow_token') || '';
    const s = storage?.getItem('webflow_site_id') || '';

    if (!t || !s) {
      setStorageAvailable(false);

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/'); // redirect to homepage or OAuth start
      }, 4000);
    }

    setToken(t);
    setSiteId(s);
    setLoaded(true);
  }, []);

  const handleInjectClick = async () => {
    if (!token || !siteId) {
      setMessage('❌ Missing token or site ID.');
      return;
    }

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
        <title>Theme Switcher Installed</title>
        <meta name="description" content="Theme Switcher has been successfully installed in Webflow." />
      </Head>

      <main className={styles['main-content']} aria-busy={injecting}>
        <Logo />
        <h1 className={styles['main-heading']}>
          Theme Switcher <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>
        </h1>
        <p className={styles['main-subheading']}>
          Let your visitors toggle between dark and light mode — no coding required.
        </p>

        {!loaded ? (
          <p style={{ fontStyle: 'italic' }}>Loading credentials…</p>
        ) : !storageAvailable ? (
          <>
            <p style={{ color: 'red', marginBottom: '1rem' }}>
              ⚠️ Unable to access credentials. Please try reinstalling the app from the Webflow App panel.
            </p>
            <p style={{ color: 'red' }}>Redirecting you shortly…</p>
          </>
        ) : (
          <button
            className={styles['main-button']}
            onClick={handleInjectClick}
            disabled={injecting || !token || !siteId}
          >
            {injecting ? 'Injecting…' : 'Inject Script to Webflow Footer'}
          </button>
        )}

        {message && (
          <p
            style={{
              marginTop: '1rem',
              color: message.startsWith('✅') ? 'green' : 'red',
              fontWeight: 'bold',
            }}
            role="alert"
          >
            {message}
          </p>
        )}

        <Footer />
      </main>
    </div>
  );
}