// pages/confirm.js

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';

export default function Confirm() {
  const router = useRouter();
  console.log('🔍 Router query:', router.query);
  const { site_id, token, test } = router.query;

  const statusRef = useRef();

  const [status, setStatus] = useState('⚠️ Please ensure you have authorized access with a valid token and site ID. This is required for the Theme Switcher App to function correctly.');
  const [injectionFailed, setInjectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const testMode = test === 'true';

  // 🛠 Begin script injection
  const injectScript = async (siteIdOverride, tokenOverride) => {
    const siteId = siteIdOverride || site_id;
    const accessToken = tokenOverride || token;
    console.log(`🕒 [${new Date().toISOString()}] InjectScript fired`);
    console.log('🚀 Starting injectScript with:', { siteId, accessToken });
    setInjectionFailed(false);
    setRetrying(true);
    setStatus('Injecting Theme Switcher into global footer...');

    try {
      if (!siteId || !accessToken) {
        throw new Error('Missing site ID or token for injection.');
      }

      console.log('📡 Injecting with full request:', {
        endpoint: '/api/inject-footer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept-version': '2.0.0',
        },
        body: { siteId, token: accessToken }
      });

      if (testMode) console.log('📦 Sending request to /api/inject-footer with:', { siteId, token: accessToken?.slice(0, 6) + '...' });

      const res = await fetch('/api/inject-footer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept-version': '2.0.0',
        },
        body: JSON.stringify({ siteId, token: accessToken }),
      });

      console.log('📨 Response status:', res.status);
      console.log('📨 Response headers:', Object.fromEntries(res.headers.entries()));

      let result;
      try {
        result = await res.json();
        console.log('📨 Parsed response body:', result);
      } catch (e) {
        const text = await res.text();
        console.error('❌ Failed to parse response JSON. Raw response:', text);
        throw new Error(`Webflow API error (${res.status}): ${text}`);
      }

      if (!res.ok) {
        throw new Error(result?.error || `Webflow API error (${res.status}): ${result?.details?.statusText || 'Unknown error'}`);
      }

      if (testMode) console.log('✅ Global footer injection successful');
      sessionStorage.setItem('webflow_site_id', siteId);
      sessionStorage.setItem('webflow_token', accessToken);
      router.replace(`/success${testMode ? '?test=true' : ''}`);
    } catch (err) {
      console.error('❌ Injection Error:', {
        message: err.message,
        siteId,
        tokenPrefix: accessToken?.slice(0, 6) + '...',
        requestBody: { siteId, token: accessToken },
      });
      setInjectionFailed(true);
      setStatus('Automatic installation failed. You can try again or follow manual install steps.');
      setErrorMsg(err.message || en.unknownError);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;

    console.log('🧾 Checking sessionStorage and query:', {
      sessionSiteId: sessionStorage.getItem('webflow_site_id'),
      sessionToken: sessionStorage.getItem('webflow_token'),
      querySiteId: site_id,
      queryToken: token
    });

    let finalSiteId = sessionStorage.getItem('webflow_site_id') || site_id;
    let finalToken = sessionStorage.getItem('webflow_token') || token;

    if (finalSiteId && finalToken) {
      sessionStorage.setItem('webflow_site_id', finalSiteId);
      sessionStorage.setItem('webflow_token', finalToken);
      injectScript(finalSiteId, finalToken);
    } else {
      console.warn('⚠️ Missing site ID or token in sessionStorage or query.');
      setStatus(en.missingCredentials);
      setInjectionFailed(true);
      setErrorMsg(en.missingCredentials);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (injectionFailed && statusRef.current) {
      statusRef.current.focus();
    }
  }, [injectionFailed]);

  const handleRetry = () => {
    if (testMode) console.log('🔁 Retrying injection...');
    setInjectionFailed(false);
    setRetrying(true);
    setTimeout(() => injectScript(site_id, token), 300);
  };

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>{en.setupHeading}</h1>
      {(!site_id || !token) && (
        <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
          ⚠️ Missing site ID or token. Please reauthorize via the main page.
        </p>
      )}
      {retrying && (
        <div
          aria-label="Loading"
          role="status"
          tabIndex="0"
          style={{
            margin: '1rem auto',
            width: '24px',
            height: '24px',
            border: '3px solid #ccc',
            borderTop: '3px solid #000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      <p aria-live="polite" tabIndex="-1" ref={statusRef} style={{ maxWidth: '500px', margin: '1rem auto' }}>{status}</p>

      {injectionFailed && (
        <div style={{ marginTop: '2rem' }}>
          <button
            aria-label="Retry injection"
            onClick={handleRetry}
            disabled={retrying}
            style={{
              padding: '10px 20px',
              marginRight: '1rem',
              fontSize: '1rem',
              cursor: retrying ? 'not-allowed' : 'pointer',
              opacity: retrying ? 0.6 : 1,
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              outline: '2px solid #fff',
              outlineOffset: '2px'
            }}
          >
            {retrying ? en.retrying : en.tryAgain}
          </button>
          <button
            aria-label="Open manual install guide"
            onClick={() => router.push(`/success?manual=true${testMode ? '&test=true' : ''}`)}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              outline: '2px solid #fff',
              outlineOffset: '2px'
            }}
          >
            {en.manualInstall}
          </button>
          {errorMsg && (
            <p role="alert" style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
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