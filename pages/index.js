// pages/index.js

import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [clientId, setClientId] = useState(null);
  const [baseUrl, setBaseUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Avoid SSR issues
    const id = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
    const url = process.env.NEXT_PUBLIC_BASE_URL;
    setClientId(id);
    setBaseUrl(url);

    if (!id || !url) {
      console.warn("Missing environment variables.");
      setError('⚠️ Missing Webflow OAuth environment variables.');
    }
  }, []);

  if (error) {
    return (
      <main style={{ textAlign: 'center', marginTop: '5rem' }}>
        <p style={{ color: 'red' }}>{error}</p>
      </main>
    );
  }

  if (!clientId || !baseUrl) return null; // SSR-safe wait

  const redirectUri = encodeURIComponent(`${baseUrl}/callback`);
  const scopes = 'sites:read pages:read pages:write custom_code:write';
  const oauthUrl = `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;

  return (
    <>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta name="description" content="Easily add light/dark theme toggling to your Webflow site. No code needed." />
      </Head>

      <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          style={{ width: '100px', marginBottom: '1rem' }}
        />

        <h1>🎨 Theme Switcher for Webflow</h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          Seamlessly let your visitors toggle between light and dark mode — no coding required.
        </p>

        <a href={oauthUrl} rel="noopener noreferrer">
          <button
            style={{
              padding: '12px 24px',
              marginTop: '2rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Connect to Webflow
          </button>
        </a>
      </main>
    </>
  );
}