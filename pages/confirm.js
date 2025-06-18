//pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token, test } = router.query;

  const [status, setStatus] = useState('Preparing to install Theme Switcher into your Webflow project...');
  const [injectionFailed, setInjectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const testMode = test === 'true';

  // 🛠 Begin script injection
  const injectScript = async () => {
    if (!site_id || !token) {
      if (testMode) console.warn('⚠️ Missing site_id or token');
      router.replace(`/install${testMode ? '?test=true' : ''}`);
      return;
    }

    setInjectionFailed(false);
    setRetrying(true);
    setStatus('Injecting Theme Switcher into Webflow Custom Code...');

    try {
      if (testMode) console.log('📡 Fetching pages for site:', site_id);

      const pagesRes = await fetch(`https://api.webflow.com/sites/${site_id}/pages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'accept-version': '1.0.0',
        },
      });

      const raw = await pagesRes.text();
      let pagesData;

      try {
        pagesData = JSON.parse(raw);
      } catch {
        throw new Error('Invalid JSON from Webflow API.');
      }

      if (!pagesRes.ok || !Array.isArray(pagesData.pages)) {
        if (pagesRes.status === 401 || pagesRes.status === 403) {
          if (testMode) console.warn('🔁 Token expired or unauthorized. Redirecting...');
          router.replace(`/install${testMode ? '?test=true' : ''}`);
          return;
        }
        throw new Error(pagesData.message || 'Failed to fetch pages.');
      }

      const targetPage = pagesData.pages[0];
      if (!targetPage) throw new Error('No pages found on this site.');

      const scriptTag = `
<!-- Installed by Theme Switcher Webflow App -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

      if (testMode) console.log('✏️ Injecting script into page:', targetPage._id);

      const patchRes = await fetch(
        `https://api.webflow.com/sites/${site_id}/pages/${targetPage._id}/custom-code`,
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

      const patchText = await patchRes.text();

      if (!patchRes.ok) {
        throw new Error(`Custom Code API failed: ${patchText}`);
      }

      // ✅ Script injected successfully
      if (testMode) console.log('✅ Script injected successfully');
      router.replace(`/success${testMode ? '?test=true' : ''}`);
    } catch (err) {
      console.error('❌ Injection Error:', err.message);
      setInjectionFailed(true);
      setStatus('Automatic installation failed. You can try again or follow manual install steps.');
      setErrorMsg(err.message);
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
    setTimeout(() => location.reload(), 300);
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
            Manual Instructions
          </button>
          {errorMsg && (
            <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
              ⚠️ {errorMsg}
            </p>
          )}
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