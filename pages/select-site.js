// pages/select-site.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const scriptTag = `
<!-- Theme Switcher script (manually copy into Webflow) -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`;

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

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

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopyFeedback('📋 Script copied manually.');
    } catch {
      setCopyFeedback('❌ Copy failed.');
    }
    document.body.removeChild(textarea);
  };

  const handleCopyScript = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(scriptTag.trim())
        .then(() => setCopyFeedback('📋 Script copied! Paste it into Webflow → Site Settings → Footer.'))
        .catch((err) => {
          console.error('Clipboard API error:', err);
          fallbackCopy(scriptTag);
        });
    } else {
      fallbackCopy(scriptTag);
    }
  };

  return (
    <main className={styles.container}>
      <div style={{ marginBottom: '1rem' }}>
        <Logo />
      </div>

      <h1 className={styles.heading}>Select a Webflow Site</h1>

      <p className={styles.note}>
        💡 To enable dark/light mode, manually add the script below to your Webflow <strong>Site Settings → Footer</strong>.
      </p>

      <div className={styles.copyContainer}>
        <pre className={styles.codeBlock}>{scriptTag.trim()}</pre>
        <button
          className={styles.selectButton}
          onClick={handleCopyScript}
          aria-label="Copy theme switcher script to clipboard"
        >
          📋 Copy Script Tag (Manual)
        </button>
        {copyFeedback && (
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#555' }}>
            {copyFeedback}
          </p>
        )}
      </div>

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
                aria-label={`Script injection unavailable for ${site.name}`}
                disabled
              >
                🚧 Auto-inject coming soon
              </button>

              <p className={styles.siteNote}>
                Webflow’s current API does not support script injection. Please use the manual copy method above.
              </p>
            </li>
          ))}
        </ul>
      )}

      <Footer />
    </main>
  );
}