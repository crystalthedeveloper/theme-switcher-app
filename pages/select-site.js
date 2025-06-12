// pages/select-site.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const queryToken = router.query.token;

    // Prefer query token, fallback to sessionStorage
    const storedToken =
      typeof window !== 'undefined' ? sessionStorage.getItem('webflow_token') : null;

    const finalToken = queryToken || storedToken;
    setToken(finalToken);

    if (!finalToken) {
      setError('Missing access token.');
      setLoading(false);
      return;
    }

    const fetchSites = async () => {
      try {
        const res = await fetch('https://api.webflow.com/rest/sites', {
          headers: {
            Authorization: `Bearer ${finalToken}`,
            'accept-version': '1.0.0',
          },
        });

        const data = await res.json();
        const filteredSites = (data.sites || []).filter(site => site.plan !== 'developer');

        if (filteredSites.length === 0) {
          console.warn('⚠️ No hosted sites found. Redirecting to manual success page.');
          router.replace('/success?manual=true');
          return;
        }

        setSites(filteredSites);
      } catch (err) {
        console.error('❌ Failed to load sites:', err);
        setError('Failed to load sites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [router.query.token]);

  const handleSelect = (siteId) => {
    if (!token) return;
    router.push(`/confirm?site_id=${siteId}&token=${token}`);
  };

  return (
    <main style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Select Your Webflow Site</h1>

      {loading && <p>Loading sites...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && sites.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sites.map(site => (
            <li key={site._id} style={{ margin: '1rem 0' }}>
              <button
                onClick={() => handleSelect(site._id)}
                style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
              >
                {site.displayName || site.name || 'Untitled Site'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}