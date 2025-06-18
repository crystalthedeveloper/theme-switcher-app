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

    if (!finalToken) {
      if (isTest) console.warn('⚠️ Missing Webflow token.');
      setError('Missing access token. Please start the install process again.');
      setLoading(false);
      return;
    }

    setToken(finalToken);

    const fetchSites = async () => {
      try {
        if (isTest) console.log('📡 Fetching sites using token (via /api/sites)');

        const res = await fetch('/api/sites', {
          headers: {
            Authorization: `Bearer ${finalToken}`,
          },
        });

        const data = await res.json();

        if (!Array.isArray(data.sites)) {
          throw new Error('Invalid response from API');
        }

        const hostedSites = data.sites.filter(site => site.plan !== 'developer');

        if (hostedSites.length === 0) {
          if (isTest) console.warn('⚠️ No hosted sites. Redirecting...');
          setError('No hosted Webflow sites found. Redirecting to manual install...');

          setTimeout(() => {
            router.replace('/success?manual=true' + (isTest ? '&test=true' : ''));
          }, 2000);
          return;
        }

        if (isTest) {
          console.log(`✅ Found ${hostedSites.length} hosted site(s).`);
        }

        setSites(hostedSites);
      } catch (err) {
        if (isTest) console.error('❌ Site fetch error:', err);
        setError('Failed to load your sites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [router.query.token]);

  const handleSelect = (siteId) => {
    if (!token) return;

    const redirect = `/confirm?site_id=${siteId}&token=${token}${testMode ? '&test=true' : ''}`;
    if (testMode) console.log('➡️ Redirecting to:', redirect);
    router.push(redirect);
  };

  return (
    <main style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Select Your Webflow Site</h1>

      {loading && <p>Loading sites...</p>}
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {!loading && !error && sites.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sites.map((site) => (
            <li key={site._id} style={{ margin: '1rem 0' }}>
              <button
                onClick={() => handleSelect(site._id)}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                {site.displayName || site.name || 'Untitled Site'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode enabled – logs visible in browser console
        </p>
      )}
    </main>
  );
}