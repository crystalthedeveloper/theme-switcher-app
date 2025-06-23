// pages/select-site.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/select-site.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function SelectSite() {
    const router = useRouter();
    const [sites, setSites] = useState([]);
    const [pagesBySite, setPagesBySite] = useState({});
    const [selectedPages, setSelectedPages] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingPages, setLoadingPages] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchSites() {
            try {
                const res = await fetch('/api/sites', { credentials: 'include' });
                const data = await res.json();
                setSites(data.sites || []);

                for (const site of data.sites) {
                    setLoadingPages(prev => ({ ...prev, [site.id]: true }));

                    const pageRes = await fetch(`/api/pages?siteId=${site.id}`, {
                        credentials: 'include',
                    });
                    const pageData = await pageRes.json();

                    setPagesBySite(prev => ({
                        ...prev,
                        [site.id]: pageData.pages || [],
                    }));
                    setLoadingPages(prev => ({ ...prev, [site.id]: false }));
                }
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
                credentials: 'include',
                body: JSON.stringify({ siteId, pageId })
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

                                {loadingPages[site.id] ? (
                                    <p>Loading pages...</p>
                                ) : (
                                    <>
                                        <label htmlFor={`select-${site.id}`}>
                                            Choose a page to inject:
                                        </label>
                                        <select
                                            id={`select-${site.id}`}
                                            aria-label={`Page selection for ${site.name}`}
                                            onChange={(e) =>
                                                setSelectedPages((prev) => ({
                                                    ...prev,
                                                    [site.id]: e.target.value,
                                                }))
                                            }
                                            value={selectedPages[site.id] || ''}
                                        >
                                            <option value="">Select a page</option>
                                            {(pagesBySite[site.id] || []).map((page) => (
                                                <option key={page.id} value={page.id}>
                                                    {page.name || page.slug}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            className={styles.selectButton}
                                            aria-label={`Inject script into selected page for ${site.name}`}
                                            disabled={!selectedPages[site.id]}
                                            onClick={() =>
                                                handleInject(site.id, selectedPages[site.id])
                                            }
                                        >
                                            Inject Script to Selected Page
                                        </button>
                                    </>
                                )}
                            </fieldset>
                        </li>
                    ))}
                </ul>
            )}
            <Footer />
        </main>
    );
}