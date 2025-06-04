// pages/select-site.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const accessToken = router.query.token; // passed from /callback

  useEffect(() => {
    if (!accessToken) return;

    const fetchSites = async () => {
      try {
        const res = await fetch('https://api.webflow.com/rest/sites', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'accept-version': '1.0.0',
          },
        });

        const data = await res.json();
        const filteredSites = (data.sites || []).filter(site => site.plan !== 'developer');

        if (filteredSites.length === 0) {
          setError('No hosted sites found.');
        } else {
          setSites(filteredSites);
        }
      } catch (err) {
        setError('Failed to load sites.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [accessToken]);

  const handleSelect = (siteId) => {
    // Send the user to script injection step
    router.push(`/confirm?site_id=${siteId}&token=${accessToken}`);
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