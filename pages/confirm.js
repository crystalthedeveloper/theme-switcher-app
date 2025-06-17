//pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token, test } = router.query;

  const [status, setStatus] = useState('Injecting script into your Webflow site...');
  const [injectionFailed, setInjectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const testMode = test === 'true';

  const injectScript = async () => {
    if (!site_id || !token) {
      if (testMode) console.warn('⚠️ Missing site_id or token');
      router.replace(`/install${testMode ? '?test=true' : ''}`);
      return;
    }

    setInjectionFailed(false);
    setRetrying(true);
    setStatus('Attempting to inject theme switcher script...');

    try {
      if (testMode) console.log('📡 Fetching pages from site:', site_id);

      const pagesRes = await fetch(`https://api.webflow.com/rest/sites/${site_id}/pages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'accept-version': '1.0.0',
        },
      });

      const pagesData = await pagesRes.json();

      if (!Array.isArray(pagesData.pages) || pagesData.pages.length === 0) {
        throw new Error('No pages found on this site.');
      }

      const targetPage = pagesData.pages[0];

      const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

      const patchRes = await fetch(
        `https://api.webflow.com/rest/sites/${site_id}/pages/${targetPage._id}/custom-code`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept-version': '1.0.0',
          },
          body: JSON.stringify({
            body: scriptTag,
            enabled: true,
          }),
        }
      );

      const resultText = await patchRes.text();

      if (!patchRes.ok) {
        throw new Error(`Custom code API failed: ${resultText}`);
      }

      if (testMode) console.log('✅ Script injected successfully');
      router.replace(`/success${testMode ? '?test=true' : ''}`);
    } catch (err) {
      console.error('❌ Injection Error:', err.message);
      setInjectionFailed(true);
      setStatus('Automatic injection failed. You can retry or install manually.');
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    injectScript();
  }, [site_id, token]);

  const handleRetry = () => {
    if (testMode) console.log('🔁 Retrying injection...');
    setInjectionFailed(false);
    setRetrying(true);
    setTimeout(() => location.reload(), 300); // Reload to trigger useEffect
  };

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>🔧 Installing Theme Switcher...</h1>
      <p style={{ maxWidth: '500px', margin: '1rem auto' }}>{status}</p>

      {injectionFailed && (
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              padding: '10px 20px',
              marginRight: '1rem',
              fontSize: '1rem',
              cursor: retrying ? 'not-allowed' : 'pointer',
              opacity: retrying ? 0.6 : 1,
            }}
          >
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
          <button
            onClick={() => router.push(`/success?manual=true${testMode ? '&test=true' : ''}`)}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Manual Install
          </button>
        </div>
      )}

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode enabled — debug logs visible in browser console.
        </p>
      )}
    </main>
  );
}