//pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token } = router.query;
  const [status, setStatus] = useState('Injecting script into your Webflow site...');

  useEffect(() => {
    if (!site_id || !token) return;

    const injectScript = async () => {
      try {
        // Step 1: Get the site's pages
        const pagesRes = await fetch(`https://api.webflow.com/rest/sites/${site_id}/pages`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'accept-version': '1.0.0',
          },
        });

        const pagesData = await pagesRes.json();
        const pages = Array.isArray(pagesData?.pages) ? pagesData.pages : [];

        if (!pages.length) {
          throw new Error('No pages found on this site.');
        }

        const targetPage = pages[0];
        setStatus(`Injecting theme switcher into page: ${targetPage.name || targetPage._id}...`);

        // Step 2: Inject the script into the custom code area
        const scriptTag = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`;

        const injectRes = await fetch(
          `https://api.webflow.com/rest/sites/${site_id}/pages/${targetPage._id}/custom-code`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'accept-version': '1.0.0',
            },
            body: JSON.stringify({
              body: scriptTag,
              enabled: true,
            }),
          }
        );

        if (!injectRes.ok) {
          console.warn('⚠️ Script injection failed, redirecting to manual fallback.');
          router.push('/success?manual=true');
          return;
        }

        console.log('✅ Script successfully injected.');
        router.push('/success');
      } catch (err) {
        console.error('❌ Injection Error:', err.message);
        setStatus('Could not inject script automatically. Redirecting to manual install...');
        setTimeout(() => {
          router.push('/success?manual=true');
        }, 1500);
      }
    };

    injectScript();
  }, [site_id, token, router]);

  return (
    <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
      <h1>🔧 Installing Theme Switcher...</h1>
      <p>{status}</p>
    </main>
  );
}