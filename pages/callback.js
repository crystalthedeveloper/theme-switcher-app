// pages/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const { code } = router.query;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const exchangeToken = async () => {
      try {
        const response = await fetch('https://api.webflow.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID,
            client_secret: process.env.WEBFLOW_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`
          })
        });

        const tokenData = await response.json();
        console.log('🔁 Webflow Token Response:', tokenData);

        if (!tokenData.access_token) {
          throw new Error(tokenData.msg || 'Access token not returned. Check client ID/secret and redirect URI.');
        }

        localStorage.setItem('wf_token', tokenData.access_token);
        router.push('/select-site');
      } catch (err) {
        console.error('❌ OAuth exchange failed:', err);
        alert('Authorization failed. Redirecting to home.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [code, router]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem' }}>
      {loading ? (
        <p>Exchanging code for access token...</p>
      ) : (
        <p style={{ color: 'red' }}>Something went wrong. Redirecting...</p>
      )}
    </main>
  );
}