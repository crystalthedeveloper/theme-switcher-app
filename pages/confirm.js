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

    const finalSiteId = sessionStorage.getItem('webflow_site_id') || site_id;
    const finalToken = sessionStorage.getItem('webflow_token') || token;

    if (finalSiteId && finalToken) {
      sessionStorage.setItem('webflow_site_id', finalSiteId);
      sessionStorage.setItem('webflow_token', finalToken);
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
        <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
          ⚠️ Missing site ID or token. Please reauthorize via the main page.
        </p>
      )}
      <p aria-live="polite" tabIndex="-1" style={{ maxWidth: '500px', margin: '1rem auto' }}>{status}</p>

      {testMode && (
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
          🧪 Test mode enabled — debug logs visible in browser console.
        </p>
      )}
    </main>
  );
}