// pages/index.js
import Head from 'next/head';
import { useEffect, useState } from 'react';
import en from '../locales/en';
import styles from './css/index.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Home() {
  const t = en;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = sessionStorage.getItem('webflow_token');
      const savedSiteId = sessionStorage.getItem('webflow_site_id');

      setToken(savedToken || '');
      setSiteId(savedSiteId || '');
      const authorized = Boolean(savedToken && savedSiteId);
      setIsAuthorized(authorized);

      if (authorized) {
        setLoadingPages(true);
        fetch(`/api/pages?siteId=${savedSiteId}`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            const staticPages = (data.pages || []).sort((a, b) =>
              (a.slug || '').localeCompare(b.slug || '')
            );
            setPages(staticPages);
            if (staticPages.length > 0) {
              setSelectedPageId(staticPages[0].id);
            }
          })
          .catch((err) => {
            console.error('❌ Failed to fetch pages:', err);
            setMessage('❌ Failed to load page list. Try reconnecting.');
          })
          .finally(() => setLoadingPages(false));
      }
    }
  }, []);

  const authURL = `https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read pages:read custom_code:write`;

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
        body: JSON.stringify({
          siteId,
          pageId: selectedPageId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message || '✅ Script successfully injected!');
        setTimeout(() => {
          window.location.href = '/success';
        }, 1000);
      } else {
        setMessage(data.message || data.error || '❌ Injection failed');
      }
    } catch (err) {
      console.error('❌ Injection error:', err);
      setMessage(err.message || '❌ Injection failed');
    } finally {
      setInjecting(false);
    }
  };

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

        {!isAuthorized && (
          <a href={authURL} aria-label="Connect Webflow app" rel="noopener noreferrer">
            <button className={styles['main-button']}>{t.buttonInstall}</button>
          </a>
        )}

        {isAuthorized && pages.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="page-select">Select page to inject:</label>
            <select
              id="page-select"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
              disabled={loadingPages || injecting}
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.slug}
                </option>
              ))}
            </select>
          </div>
        )}

        {isAuthorized && (
          <button
            className={styles['main-button']}
            onClick={handleInjectClick}
            disabled={injecting || loadingPages}
            style={{ marginTop: '1rem' }}
          >
            {injecting ? 'Injecting...' : 'Inject Script'}
          </button>
        )}

        {message && (
          <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
            {message}
          </p>
        )}

        <Footer />
      </main>
    </div>
  );
}