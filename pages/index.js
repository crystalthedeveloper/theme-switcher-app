// pages/index.js

import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';

export default function Home() {
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
      console.warn('⚠️ Missing required .env variables:', { idMissing: !id, urlMissing: !url });
      setError('Missing environment variables. Check your Webflow OAuth config.');
    } else {
      setClientId(id);
      setBaseUrl(url);
      setReady(true);

      const debugUrl = `https://webflow.com/oauth/authorize?client_id=${id}&response_type=code&redirect_uri=${encodeURIComponent(`${url}/callback`)}&scope=${encodeURIComponent(scopes)}`;
      console.log('🔗 OAuth URL (debug):', debugUrl);
    }
  }, []);

  const oauthUrl = useMemo(() => {
    if (!clientId || !baseUrl) return '';
    const redirectUri = `${baseUrl}/callback`;
    return `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  }, [clientId, baseUrl]);

  return (
    <>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta name="description" content="Add light/dark theme toggling to your Webflow site with one click. No code required." />
      </Head>

      <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          style={{ width: '100px', marginBottom: '1rem' }}
        />

        <h1>🎨 Theme Switcher for Webflow</h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          Let your visitors toggle between light and dark mode — effortlessly.
        </p>

        <a
          href={ready ? oauthUrl : '#'}
          target="_blank"
          rel="noopener noreferrer"
          title={ready ? '' : 'OAuth not ready — check environment variables.'}
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
            Connect to Webflow
          </button>
        </a>

        {error && (
          <p style={{ marginTop: '1rem', color: 'red', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
      </main>
    </>
  );
}