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
        console.log('🔁 Token Response:', tokenData);

        if (!tokenData.access_token || !tokenData.site_ids?.length) {
          throw new Error('Missing access token or site ID.');
        }

        const accessToken = tokenData.access_token;
        const siteId = tokenData.site_ids[0];

        const pagesRes = await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const pages = await pagesRes.json();

        if (!pages.length) {
          throw new Error('No pages found for the selected site.');
        }

        const firstPage = pages[0];

        await fetch(`https://api.webflow.com/v1/sites/${siteId}/pages/${firstPage._id}/custom-code`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            head: "",
            body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
            enabled: true
          })
        });

        router.push('/success');
      } catch (err) {
        console.error('❌ OAuth flow failed:', err);
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
        <p>Exchanging code and installing script...</p>
      ) : (
        <p style={{ color: 'red' }}>Something went wrong. Redirecting...</p>
      )}
    </main>
  );
}