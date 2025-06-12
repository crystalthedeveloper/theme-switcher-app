// pages/select-site.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SelectSite() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const queryToken = router.query.token;
    const isTest = router.query.test === 'true';
    setTestMode(isTest);

    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('webflow_token') : null;
    const finalToken = queryToken || storedToken;
    setToken(finalToken);

    if (!finalToken) {
      if (isTest) console.warn('⚠️ Missing token.');
      setError('Missing access token.');
      setLoading(false);
      return;
    }

    const fetchSites = async () => {
      try {
        if (isTest) console.log('📡 Fetching sites with token:', finalToken);

        const res = await fetch('https://api.webflow.com/rest/sites', {
          headers: {
            Authorization: `Bearer ${finalToken}`,
            'accept-version': '1.0.0',
          },
        });

        const data = await res.json();
        const filteredSites = (data.sites || []).filter(site => site.plan !== 'developer');

        if (isTest) {
          console.log('🌐 Sites returned:', data.sites?.length || 0);
          console.log('✅ Hosted sites found:', filteredSites.length);
        }

        if (filteredSites.length === 0) {
          if (isTest) console.warn('⚠️ No hosted Webflow sites found. Redirecting to manual success page.');
          router.replace('/success?manual=true');
          return;
        }

        setSites(filteredSites);
      } catch (err) {
        if (isTest) console.error('❌ Error fetching sites:', err);
        setError('Failed to load sites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [router.query.token]);

  const handleSelect = (siteId) => {
    if (!token) return;
    const url = `/confirm?site_id=${siteId}&token=${token}${testMode ? '&test=true' : ''}`;
    if (testMode) console.log('➡️ Navigating to:', url);
    router.push(url);
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

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode enabled – logs shown in browser console
        </p>
      )}
    </main>
  );
}