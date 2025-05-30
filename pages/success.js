//pages/success.js
export default function Success() {
  return (
    <main style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>🎉 Script Installed! 😁</h1>
      <p>Your Theme Switcher script was successfully added to your Webflow site.</p>

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