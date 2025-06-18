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
    if (!router.isReady) return;

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

    if (isTest) console.log('🔐 Using token:', finalToken);
    setToken(finalToken);

    const fetchSites = async () => {
      try {
        if (isTest) console.log('📡 Sending POST to /api/sites with token');

        const res = await fetch('/api/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: finalToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data?.expiredToken) {
            if (isTest) console.warn('🔁 Token expired. Redirecting to /install');
            router.replace(`/install${isTest ? '?test=true' : ''}`);
            return;
          }

          if (isTest) console.error('⚠️ Webflow API error:', data);
          throw new Error(`Webflow error: ${data?.error || 'Unknown issue'}`);
        }

        if (!Array.isArray(data.sites)) {
          throw new Error('Invalid response format from Webflow API');
        }

        if (data.sites.length === 0) {
          if (isTest) console.warn('⚠️ No hosted sites found. Redirecting...');
          setError('No hosted Webflow sites found. Redirecting to manual install...');
          setTimeout(() => {
            router.replace('/success?manual=true' + (isTest ? '&test=true' : ''));
          }, 2000);
          return;
        }

        setSites(data.sites);
        if (isTest) console.log(`✅ Loaded ${data.sites.length} site(s)`);
      } catch (err) {
        console.error('❌ Site fetch error:', err.message);
        setError('Failed to load your sites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [router.isReady, router.query.token]);

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
            <li key={site.id || site._id} style={{ margin: '1rem 0' }}>
              <button
                onClick={() => handleSelect(site.id || site._id)}
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
          🧪 Test mode enabled – logs visible in browser console
        </p>
      )}
    </main>
  );
}