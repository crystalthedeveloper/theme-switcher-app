//pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token, test } = router.query;

  const [status, setStatus] = useState('Preparing to install the Theme Switcher App in your Webflow site...');
  const [injectionFailed, setInjectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const testMode = test === 'true';

  // 🛠 Begin script injection
  const injectScript = async (siteIdOverride, tokenOverride) => {
    setInjectionFailed(false);
    setRetrying(true);
    setStatus('Injecting Theme Switcher into Webflow Custom Code...');

    const siteId = siteIdOverride || site_id;
    const accessToken = tokenOverride || token;

    try {
      if (testMode) console.log('📦 Sending request to /api/pages with:', { siteId, token: accessToken?.slice(0, 6) + '...' });

      const pagesRes = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, token: accessToken }),
      });

      const raw = await pagesRes.text();
      let pagesData;

      try {
        pagesData = JSON.parse(raw);
      } catch {
        throw new Error('Invalid JSON from Webflow API.');
      }

      if (!pagesRes.ok || !Array.isArray(pagesData.pages)) {
        console.warn('❌ Failed Webflow API response:', raw);
        if (pagesRes.status === 401 || pagesRes.status === 403) {
          if (testMode) console.warn('🔁 Token expired or unauthorized. Redirecting...');
          router.replace(`/${testMode ? '?test=true' : ''}`);
          return;
        }
        throw new Error(pagesData?.message || '⚠️ Failed to fetch pages. Please ensure your token is valid and includes the required scopes: `sites:read`, `pages:read`, and `custom_code:write`.');
      }

      const targetPage = pagesData.pages[0];
      if (!targetPage || !targetPage._id) {
        throw new Error('No valid pages found for this site.');
      }
      // Check if script is already present
      const existingBody = targetPage?.customCode?.body || '';
      if (existingBody.includes('theme-switcher.js')) {
        router.replace(`/success${testMode ? '?test=true' : ''}`);
        return;
      }

      const scriptTag = `
<!-- Installed by Theme Switcher Webflow App -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

      if (testMode) console.log('✏️ Injecting script into page:', targetPage._id);

      const patchRes = await fetch(
        `https://api.webflow.com/sites/${siteId}/pages/${targetPage._id}/custom-code`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
    if (!router.isReady || typeof window === 'undefined') return;

    const storedSiteId = sessionStorage.getItem('webflow_site_id');
    const storedToken = sessionStorage.getItem('webflow_token');

    const resolvedSiteId = site_id || storedSiteId;
    const resolvedToken = token || storedToken;

    if (resolvedSiteId && resolvedToken) {
      const existingSiteId = sessionStorage.getItem('webflow_site_id');
      const existingToken = sessionStorage.getItem('webflow_token');

      if (resolvedSiteId !== existingSiteId) {
        sessionStorage.setItem('webflow_site_id', resolvedSiteId);
      }
      if (resolvedToken !== existingToken) {
        sessionStorage.setItem('webflow_token', resolvedToken);
      }

      injectScript(resolvedSiteId, resolvedToken);
    } else {
      setStatus("⚠️ Missing site ID or token. Please reauthorize via the main page.");
    }
  }, [router.isReady]);

  const handleRetry = () => {
    if (testMode) console.log('🔁 Retrying injection...');
    setInjectionFailed(false);
    setRetrying(true);
    setTimeout(() => location.reload(), 300);
  };

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>🔧 Setting up Theme Switcher...</h1>
      {(!site_id || !token) && (
        <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
          ⚠️ Missing site ID or token. Please reauthorize via the main page.
        </p>
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
    </main>
  );
}