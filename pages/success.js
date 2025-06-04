//pages/success.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/');
    }, 10000); // Auto-redirect in 10 seconds

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '2rem' }}>✅ Theme Switcher Installed</h1>
      <p style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '1rem auto' }}>
        Your dark/light theme toggle has been successfully added to your Webflow site.
      </p>

      <p style={{ marginTop: '1rem', color: '#666', fontStyle: 'italic' }}>
        You’ll be redirected back to the home page in 10 seconds.
      </p>

      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <a href="/" aria-label="Return to home page">
          <button
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ← Back to Home
          </button>
        </a>

        <a
          href="https://webflow.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Webflow Dashboard in new tab"
        >
          <button
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Go to Webflow Dashboard
          </button>
        </a>
      </div>
    </main>
  );
}