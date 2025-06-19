// pages/index.js

import Head from 'next/head';
import en from '../locales/en';

export default function Home() {
  const t = en;
  return (
    <div>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main role="main" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          role="img"
          aria-label="Logo of Crystal The Developer"
          style={{ width: '80px', marginBottom: '1rem' }}
        />

        <h1 style={{ fontSize: '2rem' }}>{t.heading}</h1>

        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
          {t.paragraph}
        </p>

        <a
          href={`https://webflow.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/callback')}&response_type=code&scope=sites:read pages:read custom_code:write`}
          aria-label="Authorize with Webflow and connect this app"
          rel="noopener noreferrer"
        >
          <button
            type="button"
            style={{
              padding: '12px 24px',
              marginTop: '2rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {t.button}
          </button>
        </a>

        <footer style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#999' }}>
          <p>{t.footer}</p>
        </footer>
      </main>
    </div>
  );
}