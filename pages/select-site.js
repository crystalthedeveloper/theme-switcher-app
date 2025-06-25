// pages/select-site.js

import { useEffect, useState } from 'react';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function SelectSite() {
  const [sites, setSites] = useState([]);
  const [pages, setPages] = useState({});
  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSitesAndPages() {
      try {
        const siteRes = await fetch('/api/sites', { credentials: 'include' });
        const siteData = await siteRes.json();
        const siteList = siteData.sites || [];
        setSites(siteList);

        const allPages = {};
        for (const site of siteList) {
          const pageRes = await fetch('/api/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: site.id }),
          });
          const pageData = await pageRes.json();
          allPages[site.id] = pageData.pages || [];
        }

        setPages(allPages);
      } catch (err) {
        console.error('Error loading sites/pages:', err);
        setError('Failed to load Webflow sites and pages.');
      } finally {
        setLoading(false);
      }
    }

    fetchSitesAndPages();
  }, []);

  const handleInject = async (siteId, pageId) => {
    setInjecting(true);
    setMessage('');

    try {
      const res = await fetch('/api/inject-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, pageId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || '✅ Script successfully injected!');
      } else {
        console.error('Inject error:', data);
        setMessage(`❌ Injection failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Unexpected injection error:', err);
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

      <h1 className={styles.heading}>Select a Webflow Page to Inject Script</h1>

      {message && (
        <p style={{ color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>
      )}

      {loading ? (
        <p>Loading sites...</p>
      ) : error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : sites.length === 0 ? (
        <p className={styles.error} role="alert">
          No connected Webflow sites found.
        </p>
      ) : (
        <ul className={styles.siteList} role="list">
          {sites.map((site) => (
            <li key={site.id} className={styles.siteItem} role="listitem">
              <h2 className={styles.siteTitle}>{site.name}</h2>
              {pages[site.id]?.map((page) => (
                <div key={page._id} className={styles.pageItem}>
                  <p>{page.name}</p>
                  <button
                    className={styles.selectButton}
                    disabled={injecting}
                    onClick={() => handleInject(site.id, page._id)}
                  >
                    💉 Inject into "{page.name}"
                  </button>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      <Footer />
    </main>
  );
}