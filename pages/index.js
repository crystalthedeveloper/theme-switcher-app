// pages/index.js

import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta
          name="description"
          content="Add a dark/light theme toggle to your Webflow site with one click. Built by Crystal The Developer."
        />
      </Head>

      <main role="main" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          role="img"
          aria-label="Logo of Crystal The Developer"
          style={{ width: '80px', marginBottom: '1rem' }}
        />

        <h1 style={{ fontSize: '2rem' }}>🎨 Theme Switcher for Webflow</h1>

        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        <a
          href={`https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read pages:read custom_code:write`}
          aria-label="Authorize with Webflow and connect this app"
          rel="noopener noreferrer"
        >
          <button
            style={{
              padding: '12px 24px',
              marginTop: '2rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Install Theme Switcher
          </button>
        </a>

        <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#999' }}>
          <p>Created by Crystal The Developer Inc. • Powered by the Webflow App SDK</p>
        </div>
      </main>
    </div>
  );
}