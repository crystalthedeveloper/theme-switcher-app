// pages/select-site.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
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
        setError('Failed to load sites');
      } finally {
        setLoading(false);
      }
    }

    fetchSites();
  }, []);

  const handleInject = async (siteId) => {
    try {
      const res = await fetch('/api/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteId }) // no pageId needed anymore
      });

      const result = await res.json();
      router.push(result.success ? '/success?installed=true' : '/success?manual=true');
    } catch (err) {
      console.error('Injection error:', err);
      router.push('/success?manual=true');
    }
  };

  return (
    <main className={styles.container}>
      <div style={{ marginBottom: '1rem' }}>
        <Logo />
      </div>

      <h1 className={styles.heading}>Select a Webflow Site</h1>

      {loading ? (
        <p>Loading sites...</p>
      ) : error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : sites.length === 0 ? (
        <p className={styles.error} role="alert">
          No Webflow sites found. Make sure you're logged in and authorized.
        </p>
      ) : (
        <ul className={styles.siteList}>
          {sites.map((site) => (
            <li key={site.id} className={styles.siteItem}>
              <fieldset>
                <legend><strong>{site.name}</strong></legend>

                <button
                  className={styles.selectButton}
                  aria-label={`Inject script into ${site.name}`}
                  onClick={() => handleInject(site.id)}
                >
                  Inject Script to Site
                </button>
              </fieldset>
            </li>
          ))}
        </ul>
      )}
      <Footer />
    </main>
  );
}