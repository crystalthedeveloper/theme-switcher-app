// pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';

export default function Confirm() {
  const router = useRouter();
  console.log('🔍 Router query:', router.query);
  const { site_id, token, test } = router.query;

  const [status, setStatus] = useState('Setting up Theme Switcher. Please wait...');
  const testMode = test === 'true';

  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;

    console.log('🧾 Checking sessionStorage and query:', {
      sessionSiteId: sessionStorage.getItem('webflow_site_id'),
      sessionToken: sessionStorage.getItem('webflow_token'),
      querySiteId: site_id,
      queryToken: token
    });

    const effectiveSiteId = sessionStorage.getItem('webflow_site_id') || site_id;
    const effectiveToken = sessionStorage.getItem('webflow_token') || token;

    if (effectiveSiteId && effectiveToken) {
      sessionStorage.setItem('webflow_site_id', effectiveSiteId);
      sessionStorage.setItem('webflow_token', effectiveToken);
      console.log('✅ Redirecting to /success with site and token saved.');
      router.replace(`/success${testMode ? '?test=true' : ''}`);
    } else {
      console.warn('⚠️ Missing site ID or token in sessionStorage or query.');
      setStatus(en.missingCredentials);
    }
  }, [router.isReady]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>{en.setupHeading}</h1>
      {(!site_id || !token) && (
        <p style={{ color: 'red', marginTop: '1rem', fontSize: '1rem' }}>
          ⚠️ Missing site ID or token. Please reauthorize via the main page.
        </p>
      )}
      <p aria-live="polite" tabIndex="-1" style={{ maxWidth: '500px', margin: '1rem auto' }}>{status}</p>

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '1rem', color: '#999' }}>
          🧪 Test mode is enabled — check the browser console for debug logs.
        </p>
      )}
    </main>
  );
}