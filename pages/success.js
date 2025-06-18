//pages/success.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Success() {
  const router = useRouter();
  const showManualInstall = router.query.manual === 'true';

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/');
    }, 10000); // Redirect after 10 seconds

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <>
      <Head>
        <title>Success – Theme Switcher Installed</title>
        <meta name="description" content="Your Theme Switcher script was successfully added to your Webflow site." />
      </Head>
      <main role="main" style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }} aria-live="polite">✅ Installation Complete</h1>

        <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '1rem auto' }}>
          The Theme Switcher script was successfully injected into your Webflow project.
        </p>

        {showManualInstall && (
          <section aria-label="Manual Installation Instructions" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#222', marginBottom: '0.5rem' }}>
              Manual Installation Instructions
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#555' }}>
              If the Custom Code API was temporarily unavailable, you can still manually enable the toggle.
            </p>
            <ol style={{ fontSize: '0.9rem', color: '#444', marginTop: '1rem', paddingLeft: '1.2rem' }}>
              <li>Open your Webflow <strong>Project Settings</strong>.</li>
              <li>Go to the <strong>Custom Code</strong> tab.</li>
              <li>Paste the following code inside the <strong>Footer Code</strong> box:</li>
            </ol>
            <pre
              aria-label="Theme switcher script to copy"
              style={{
                background: '#f4f4f4',
                padding: '10px',
                borderRadius: '6px',
                marginTop: '1rem',
                fontSize: '0.85rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
&lt;script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer&gt;&lt;/script&gt;
            </pre>

            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '2rem' }}>
              To remove it, simply delete the script from your <strong>Custom Code</strong> tab.
              <br /><br />
              To uninstall the app, visit your Webflow site’s <strong>Apps &amp; Integrations</strong> tab and choose <em>Uninstall</em> under Theme Switcher.
            </p>
          </section>
        )}

        <p role="status" aria-live="polite" style={{ marginTop: '1.5rem', color: '#777', fontStyle: 'italic' }}>
          You’ll be redirected to the homepage in 10 seconds...
        </p>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="/" aria-label="Return to homepage">
            <button
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              ← Home
            </button>
          </a>

          <a
            href="https://webflow.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Webflow dashboard in new tab"
          >
            <button
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Webflow Dashboard
            </button>
          </a>
        </div>
      </main>
    </>
  );
}