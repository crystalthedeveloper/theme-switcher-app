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
    const [injecting, setInjecting] = useState(null); // track which site is injecting

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
        setInjecting(siteId);
        try {
            const res = await fetch('/api/inject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ siteId })
            });

            const result = await res.json();
            router.push(result.success ? '/success?installed=true' : '/success?manual=true');
        } catch (err) {
            console.error('Injection error:', err);
            router.push('/success?manual=true');
        } finally {
            setInjecting(null);
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
                <ul className={styles.siteList} role="list">
                    {sites.map((site) => (
                        <li key={site.id} className={styles.siteItem} role="listitem">
                            <h2 className={styles.siteTitle}>{site.name}</h2>

                            <button
                                className={styles.selectButton}
                                aria-label={`Inject script into ${site.name}`}
                                onClick={() => handleInject(site.id)}
                                disabled={injecting === site.id}
                            >
                                {injecting === site.id ? 'Injecting...' : 'Inject Script to Site'}
                            </button>

                            <p className={styles.siteNote}>
                                Script will be injected globally into the site’s <code>&lt;/body&gt;</code> tag.
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            <Footer />
        </main>
    );
}