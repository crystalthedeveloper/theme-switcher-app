// pages/index.js

import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const testMode = router.query.test === 'true';

  const [clientId, setClientId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const scopes = [
    'sites:read',
    'sites:write',
    'pages:read',
    'pages:write',
    'custom_code:write',
  ].join(' ');

  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID || '';
    const url = process.env.NEXT_PUBLIC_BASE_URL || '';

    if (!id || !url) {
      console.warn('⚠️ Missing .env vars:', { idMissing: !id, urlMissing: !url });
      setError('Missing environment config. Please check .env setup.');
      return;
    }

    setClientId(id);
    setBaseUrl(url);
    setReady(true);

    const debugUrl = `https://webflow.com/oauth/authorize?client_id=${id}&response_type=code&redirect_uri=${encodeURIComponent(
      `${url}/callback`
    )}&scope=${encodeURIComponent(scopes)}${testMode ? '&state=test' : ''}`;
    if (testMode) console.log('🧪 Test Mode: OAuth URL →', debugUrl);
  }, [testMode]);

  const oauthUrl = useMemo(() => {
    if (!clientId || !baseUrl) return '';
    const redirectUri = `${baseUrl}/callback`;
    return `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}${testMode ? '&state=test' : ''}`;
  }, [clientId, baseUrl, testMode]);

  return (
    <>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta
          name="description"
          content="Add light/dark theme toggling to your Webflow site with one click. No code required."
        />
      </Head>

      <main style={{ textAlign: 'center', marginTop: '4rem', padding: '0 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          style={{ width: '80px', marginBottom: '1rem' }}
        />

        <h1 style={{ fontSize: '2rem' }}>🎨 Theme Switcher for Webflow</h1>

        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          Let your visitors toggle between light and dark mode — effortlessly.
        </p>

        <a
          href={ready && oauthUrl ? oauthUrl : '#'}
          target="_blank"
          rel="noopener noreferrer"
          title={ready ? 'Start install flow' : 'Waiting on config...'}
        >
          <button
            disabled={!ready}
            style={{
              padding: '12px 24px',
              marginTop: '2rem',
              fontSize: '1rem',
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.5,
            }}
          >
            Install Theme Switcher
          </button>
        </a>

        {error && (
          <p style={{ marginTop: '1rem', color: 'red', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        {!error && ready && !oauthUrl && (
          <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
            Generating OAuth URL...
          </p>
        )}

        {testMode && (
          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#999' }}>
            🧪 Test mode enabled — logs visible in console
          </p>
        )}
      </main>
    </>
  );
}