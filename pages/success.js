//pages/success.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';

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
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '2rem' }}>✅ Theme Switcher Installed</h1>

      <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '1rem auto' }}>
        Your dark/light toggle script has been added to your Webflow site.
      </p>

      {showManualInstall && (
        <p style={{ fontSize: '0.95rem', color: '#666', maxWidth: '480px', margin: '0 auto' }}>
          If the Custom Code API isn’t available yet, please paste this script manually into your Webflow Project Settings:
          <br />
          <code style={{ display: 'inline-block', marginTop: '0.5rem', background: '#f1f1f1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
            &lt;script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer&gt;&lt;/script&gt;
          </code>
        </p>
      )}

      <p style={{ marginTop: '1.5rem', color: '#999', fontStyle: 'italic' }}>
        Redirecting to home in 10 seconds...
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
  );
}