// pages/settings.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Settings() {
  const router = useRouter();
  const [siteId, setSiteId] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedSiteId = sessionStorage.getItem('webflow_site_id');
    const storedToken = sessionStorage.getItem('webflow_token');
    setSiteId(storedSiteId || '');
    setToken(storedToken || '');
  }, []);

  const reinject = async () => {
    setMessage('Reinjecting...');
    const res = await fetch('/api/inject-footer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, token }),
    });
    const result = await res.json();
    setMessage(result.message || result.error || 'Unknown response.');
  };

  const uninstall = async () => {
    setMessage('Uninstalling...');
    const res = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: siteId, token }),
    });
    const result = await res.json();
    setMessage(result.message || result.error || 'Unknown response.');
  };

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>⚙️ Theme Switcher Settings</h1>

      <p>
        <strong>Site ID:</strong> {siteId || 'Not found'}
        <br />
        <strong>Token:</strong> {token ? token.slice(0, 6) + '•••' : 'Not found'}
      </p>

      <div style={{ margin: '1.5rem 0' }}>
        <button
          onClick={reinject}
          disabled={!token || !siteId}
          aria-label="Reinject theme switcher script"
          style={{
            marginRight: '1rem',
            outline: '2px solid transparent',
            outlineOffset: '2px',
            transition: 'outline-color 0.2s ease-in-out',
          }}
          onFocus={(e) => e.target.style.outlineColor = '#000'}
          onBlur={(e) => e.target.style.outlineColor = 'transparent'}
        >
          🔁 Reinject Script
        </button>
        <button
          onClick={uninstall}
          disabled={!token || !siteId}
          aria-label="Uninstall theme switcher script"
          style={{
            outline: '2px solid transparent',
            outlineOffset: '2px',
            transition: 'outline-color 0.2s ease-in-out',
          }}
          onFocus={(e) => e.target.style.outlineColor = '#000'}
          onBlur={(e) => e.target.style.outlineColor = 'transparent'}
        >
          ❌ Uninstall Script
        </button>
      </div>

      {message && (
        <p
          aria-live="polite"
          style={{ marginTop: '1rem', color: message.includes('error') ? 'red' : 'green' }}
        >
          {message}
        </p>
      )}
    </main>
  );
}