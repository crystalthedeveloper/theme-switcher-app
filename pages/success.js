//pages/success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/');
    }, 10000); // Redirect after 10 seconds

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>✅ Script Installed Successfully!</h1>
      <p>Your Theme Switcher script was successfully added to your Webflow site.</p>
      <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#888' }}>
        Redirecting to home in 10 seconds...
      </p>

      <div style={{ marginTop: '2.5rem' }}>
        <a href="/">
          <button style={{ padding: '10px 20px', marginRight: '1rem' }}>
            Back to Home
          </button>
        </a>

        <a
          href="https://webflow.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button style={{ padding: '10px 20px' }}>
            Go to Webflow
          </button>
        </a>
      </div>
    </main>
  );
}