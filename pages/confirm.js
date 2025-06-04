//pages/confirm.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Confirm() {
  const router = useRouter();
  const { site_id, token } = router.query;
  const [status, setStatus] = useState('Injecting script...');

  useEffect(() => {
    if (!site_id || !token) return;

    const injectScript = async () => {
      try {
        // Step 1: Get pages for the selected site
        const pagesRes = await fetch(`https://api.webflow.com/rest/sites/${site_id}/pages`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'accept-version': '1.0.0',
          },
        });

        const pagesData = await pagesRes.json();
        const pages = pagesData?.pages || [];

        if (!Array.isArray(pages) || pages.length === 0) {
          throw new Error('No pages found for this site.');
        }

        const targetPage = pages[0];
        setStatus(`Injecting into: ${targetPage.name || targetPage._id}`);

        // Step 2: Inject script via custom-code API
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
          console.warn('⚠️ Script injection failed.');
          router.push('/success?manual=true');
        } else {
          console.log('✅ Script successfully injected.');
          router.push('/success');
        }
      } catch (err) {
        console.error('❌ Injection Error:', err.message);
        router.push('/success?manual=true');
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