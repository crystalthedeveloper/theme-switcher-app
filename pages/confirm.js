// pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token, test } = router.query;

  const [status, setStatus] = useState('⚠️ Please ensure you have authorized access with a valid token and site ID. This is required for the Theme Switcher App to function correctly.');
  const [injectionFailed, setInjectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const testMode = test === 'true';

  // 🛠 Begin script injection
  const injectScript = async (siteIdOverride, tokenOverride) => {
    setInjectionFailed(false);
    setRetrying(true);
    setStatus('Injecting Theme Switcher into global footer...');

    const siteId = siteIdOverride || site_id;
    const accessToken = tokenOverride || token;

    try {
      if (testMode) console.log('📦 Sending request to /api/inject-footer with:', { siteId, token: accessToken?.slice(0, 6) + '...' });

      const res = await fetch('/api/inject-footer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, token: accessToken }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.error || 'Unknown error during script injection.');
      }

      if (testMode) console.log('✅ Global footer injection successful');
      sessionStorage.setItem('webflow_site_id', siteId);
      sessionStorage.setItem('webflow_token', accessToken);
      router.replace(`/success${testMode ? '?test=true' : ''}`);
    } catch (err) {
      console.error('❌ Injection Error:', err.message);
      setInjectionFailed(true);
      setStatus('Automatic installation failed. You can try again or follow manual install steps.');
      setErrorMsg(err.message || 'Unknown error occurred while injecting the script.');
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;

    let finalSiteId = sessionStorage.getItem('webflow_site_id') || site_id;
    let finalToken = sessionStorage.getItem('webflow_token') || token;

    if (finalSiteId && finalToken) {
      sessionStorage.setItem('webflow_site_id', finalSiteId);
      sessionStorage.setItem('webflow_token', finalToken);
      injectScript(finalSiteId, finalToken);
    } else {
      console.warn('⚠️ Missing site ID or token in sessionStorage or query.');
      setStatus("⚠️ Missing access token or site ID from Webflow. Please reauthorize from the homepage.");
      setInjectionFailed(true);
      setErrorMsg("Missing access token or site ID from Webflow. Please return to the homepage and reauthorize.");
    }
  }, [router.isReady]);

  const handleRetry = () => {
    if (testMode) console.log('🔁 Retrying injection...');
    setInjectionFailed(false);
    setRetrying(true);
    setTimeout(() => injectScript(site_id, token), 300);
  };

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>🔧 Setting up Theme Switcher...</h1>
      {(!site_id || !token) && (
        <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
          ⚠️ Missing site ID or token. Please reauthorize via the main page.
        </p>
      )}
      {retrying && (
        <div style={{ margin: '1rem auto', width: '24px', height: '24px', border: '3px solid #ccc', borderTop: '3px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      )}
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
            Manual Install Guide
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
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}