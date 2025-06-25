// pages/select-site.js

import { useEffect, useState } from 'react';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function SelectSite() {
  const [sites, setSites] = useState([]);
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/sites', { credentials: 'include' });
        const data = await res.json();
        setSites(data.sites || []);
      } catch (err) {
        console.error('Error fetching sites:', err);
        setError('Unable to load Webflow sites.');
      } finally {
        setLoading(false);
      }
    }

    fetchSites();
  }, []);

  const handleInject = async (siteId) => {
    setInjecting(true);
    setMessage('');

    try {
      const res = await fetch('/api/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || '✅ Script successfully injected!');
      } else {
        console.error('Inject error:', data);
        setMessage(`❌ Injection failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Unexpected error during injection:', err);
      setMessage('❌ Injection error. Please try again.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <main className={styles.container}>
      <div style={{ marginBottom: '1rem' }}>
        <Logo />
      </div>

      <h1 className={styles.heading}>Select a Webflow Site & Inject Script</h1>

      {message && (
        <p style={{ color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>
      )}

      {loading ? (
        <p>Loading sites...</p>
      ) : error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : sites.length === 0 ? (
        <p className={styles.error} role="alert">
          No connected Webflow sites found. Please make sure you're logged in and authorized.
        </p>
      ) : (
        <ul className={styles.siteList} role="list">
          {sites.map((site) => (
            <li key={site.id} className={styles.siteItem} role="listitem">
              <h2 className={styles.siteTitle}>{site.name}</h2>

              <button
                className={styles.selectButton}
                disabled={injecting}
                onClick={() => handleInject(site.id)}
              >
                🚀 Inject Theme Switcher Globally
              </button>
            </li>
          ))}
        </ul>
      )}

      <Footer />
    </main>
  );
}