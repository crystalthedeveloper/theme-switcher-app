// pages/install.js

import Head from 'next/head';

export default function Install() {
  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const scopes = [
    'sites:read',
    'sites:write',
    'pages:read',
    'pages:write',
    'custom_code:write',
  ].join(' ');

  const redirectUri = `${baseUrl}/callback`;
  const oauthUrl = clientId && baseUrl
    ? `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`
    : null;

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
        <h1>🎨 Install Theme Switcher for Webflow</h1>

        <p style={{ maxWidth: '480px', margin: '1rem auto', fontSize: '1.1rem' }}>
          Add a theme toggle to your Webflow site in one click. Let your users switch between light and dark mode — effortlessly.
        </p>

        <p style={{ maxWidth: '480px', margin: '1rem auto', color: '#666' }}>
          This app needs access to your Webflow pages and custom code to install the script. Your site must be on a paid hosting plan.
        </p>

        {oauthUrl ? (
          <a
            href={oauthUrl}
            rel="noopener noreferrer"
            aria-label="Begin Webflow OAuth authorization"
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
        ) : (
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
          <p>If script injection fails, you'll see a fallback screen with manual install instructions.</p>
          <p>You can remove the script anytime in your Webflow Project Settings &gt; Custom Code.</p>
        </div>
      </main>
    </>
  );
}