// pages/index.js

import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta
          name="description"
          content="Add a dark/light theme toggle to your Webflow site with one click. Built by Crystal The Developer."
        />
      </Head>

      <main style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          style={{ width: '80px', marginBottom: '1rem' }}
        />

        <h1 style={{ fontSize: '2rem' }}>🎨 Theme Switcher for Webflow</h1>

        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          Let your visitors switch between dark and light mode — no coding required.
        </p>

        <Link href="/install" passHref legacyBehavior>
          <a aria-label="Start install process">
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
        </Link>

        <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#999' }}>
          <p>Created by Crystal The Developer Inc. • Powered by the Webflow App SDK</p>
        </div>
      </main>
    </>
  );
}