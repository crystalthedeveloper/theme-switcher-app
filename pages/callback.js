// pages/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (!code) return;

    const exchangeToken = async () => {
      try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
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

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
          throw new Error('Access token not returned. Check client ID/secret and redirect URI.');
        }

        const accessToken = tokenData.access_token;
        console.log('✅ Access Token:', accessToken);

        // 2. Save token for use in other pages
        localStorage.setItem('wf_token', accessToken);

        // 3. Redirect to site selection page
        router.push('/select-site');
      } catch (err) {
        console.error('❌ OAuth exchange failed:', err);
        alert('Failed to authorize with Webflow. Please try again.');
      }
    };

    exchangeToken();
  }, [code, router]);

  return (
    <p style={{ textAlign: 'center', marginTop: '5rem' }}>
      Exchanging code for access token...
    </p>
  );
}