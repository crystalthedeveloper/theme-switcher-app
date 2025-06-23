// pages/select-site.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const scriptTag = `
<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`;

export default function SelectSite() {
    const router = useRouter();
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [injecting, setInjecting] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState('');

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
            setCopyFeedback('📋 Script copied manually!');
        } catch (err) {
            setCopyFeedback('❌ Copy failed');
        }
        document.body.removeChild(textarea);
    };

    const handleCopyScript = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(scriptTag.trim())
                .then(() => setCopyFeedback('📋 Script copied! Paste it into Site Settings → Footer.'))
                .catch((err) => {
                    console.error('❌ Clipboard API error:', err);
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

            {/* Copy section at top */}
            <p className={styles.note}>
                💡 For full-site coverage, manually paste the script into your Webflow <strong>Site Settings → Global Custom Code</strong>.
            </p>
            <div className={styles.copyContainer}>
                <pre className={styles.codeBlock}>
                    {scriptTag.trim()}
                </pre>
                <button
                    className={styles.selectButton}
                    onClick={handleCopyScript}
                    aria-label="Copy script tag to clipboard"
                >
                    📋 Copy Script Tag
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
                    No Webflow sites found. Make sure you're logged in and authorized.
                </p>
            ) : (
                <ul className={styles.siteList} role="list">
                    {sites.map((site) => (
                        <li key={site.id} className={styles.siteItem} role="listitem">
                            <h2 className={styles.siteTitle}>{site.name}</h2>

                            <button
                                className={styles.selectButton}
                                aria-label={`Inject script into ${site.name}`}
                                disabled
                            >
                                🚧 Inject Script to Site (coming soon)
                            </button>

                            <p className={styles.siteNote}>
                                Webflow does not currently allow script injection via API. Please copy the script above manually.
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            <Footer />
        </main>
    );
}