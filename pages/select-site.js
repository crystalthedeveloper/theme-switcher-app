// pages/select-site.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/select-site.module.css';

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/sites');
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

  const handleInject = async (siteId, pageId) => {
    try {
      const res = await fetch('/api/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, pageId })
      });

      const result = await res.json();

      if (result.success) {
        router.push('/success?installed=true');
      } else {
        router.push('/success?manual=true');
      }
    } catch (err) {
      console.error('Injection error:', err);
      router.push('/success?manual=true');
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>Select a Webflow Site</h1>

      {loading ? (
        <p>Loading sites...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <ul className={styles.siteList}>
          {sites.map((site) => (
            <li key={site.id} className={styles.siteItem}>
              <strong>{site.name}</strong>
              <p>{site.shortName}</p>

              <button
                className={styles.selectButton}
                onClick={async () => {
                  const pageRes = await fetch(`/api/pages?siteId=${site.id}`);
                  const pageData = await pageRes.json();
                  const firstPage = pageData.pages?.[0];
                  if (firstPage) {
                    setSelectedPage({ siteId: site.id, pageId: firstPage.id });
                    await handleInject(site.id, firstPage.id);
                  } else {
                    router.push('/success?manual=true');
                  }
                }}
              >
                Inject Script to Home Page
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}