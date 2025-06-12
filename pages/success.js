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
        Your theme switcher script has been successfully added to your Webflow site.
      </p>

      {showManualInstall && (
        <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#333' }}>Manual Install Instructions</h2>
          <p style={{ fontSize: '0.95rem', color: '#555' }}>
            If the Custom Code API wasn’t available, you can still enable the toggle by adding this script
            to your Webflow Project Settings (in the <strong>Footer Code</strong> section):
          </p>
          <pre
            style={{
              background: '#f4f4f4',
              padding: '10px',
              borderRadius: '6px',
              marginTop: '1rem',
              fontSize: '0.85rem',
              overflowX: 'auto',
            }}
          >
            &lt;script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer&gt;&lt;/script&gt;
          </pre>
        </div>
      )}

      <p role="alert" style={{ marginTop: '1.5rem', color: '#999', fontStyle: 'italic' }}>
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