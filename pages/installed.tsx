// pages/installed.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from './css/index.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Installed() {
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');

  useEffect(() => {
    let storage = sessionStorage;
    try {
      if (window.parent && window.parent !== window && window.parent.sessionStorage) {
        storage = window.parent.sessionStorage;
      }
    } catch (err) {}

    setToken(storage.getItem('webflow_token') || '');
    setSiteId(storage.getItem('webflow_site_id') || '');
  }, []);

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
    } catch {
      setMessage('❌ Script injection error.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Theme Switcher Installed</title>
      </Head>
      <main className={styles['main-content']}>
        <Logo />
        <h1 className={styles['main-heading']}>
          Theme Switcher <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>✅ Installed</span>
        </h1>
        <p className={styles['main-subheading']}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        <button className={styles['main-button']} onClick={handleInjectClick} disabled={injecting}>
          {injecting ? 'Injecting…' : 'Inject Script to Webflow Footer'}
        </button>
        {message && (
          <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>
        )}

        <Footer />
      </main>
    </div>
  );
}