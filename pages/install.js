// pages/install.js

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Install() {
  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const testMode = router.query.test === 'true';

  const [hasToken, setHasToken] = useState(false);

  const scopes = [
    'sites:read',
    'sites:write',
    'pages:read',
    'pages:write',
    'custom_code:write',
  ].join(' ');

  const redirectUri = `${baseUrl}/callback`;
  const oauthUrl =
    clientId && baseUrl
      ? `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&scope=${encodeURIComponent(scopes)}${testMode ? '&state=test' : ''}`
      : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('webflow_token');
      if (token) {
        setHasToken(true);
        if (testMode) console.log('🧪 Token found, redirecting to /select-site');
        router.replace(`/select-site${testMode ? '?test=true' : ''}`);
      }
    }
  }, [router, testMode]);

  return (
    <>
      <Head>
        <title>Install Theme Switcher</title>
        <meta
          name="description"
          content="Install the Theme Switcher app for Webflow to enable dark/light mode toggling on your site."
        />
      </Head>

      <main style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>🎨 Install Theme Switcher for Webflow</h1>

        <p style={{ maxWidth: '480px', margin: '1rem auto', fontSize: '1.1rem' }}>
          Add a dark/light mode toggle to your Webflow site in one click.
        </p>

        <p style={{ maxWidth: '480px', margin: '1rem auto', color: '#666' }}>
          This app needs access to your Webflow pages and Custom Code settings. Your site must be on a paid Webflow plan.
        </p>

        {!hasToken && oauthUrl && (
          <a
            href={oauthUrl}
            rel="noopener noreferrer"
            aria-label="Connect to Webflow via OAuth"
          >
            <button
              style={{
                padding: '12px 24px',
                marginTop: '2rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Connect to Webflow
            </button>
          </a>
        )}

        {!hasToken && !oauthUrl && (
          <button
            disabled
            style={{
              padding: '12px 24px',
              marginTop: '2rem',
              fontSize: '1rem',
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
            title="Missing environment variables"
          >
            Unable to Connect — Missing Config
          </button>
        )}

        <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#999' }}>
          <p>If injection fails, you’ll see manual install instructions.</p>
          <p>You can remove the script in Webflow → Project Settings → Custom Code.</p>
        </div>

        {testMode && (
          <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
            🧪 Test mode enabled — logs visible in console.
          </p>
        )}
      </main>
    </>
  );
}