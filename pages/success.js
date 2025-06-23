// pages/success.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './css/success.module.css';

export default function Success() {
  const router = useRouter();
  const { query } = router;
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (query.manual === 'true') {
      setIsManual(true);
    }
  }, [query]);

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>🎉 All Set!</h1>

      {isManual ? (
        <p className={styles.message}>
          ⚠️ We couldn't inject the script automatically.<br />
          Please paste the script manually into your Webflow <strong>Page Settings → Footer Code</strong> or
          <strong> Site Settings → Global Custom Code</strong>.
        </p>
      ) : (
        <p className={styles.message}>
          ✅ Theme Switcher was successfully injected into your home page!<br />
          You can always revisit this page to re-inject if needed.
        </p>
      )}

      <p className={styles.note}>
        💡 For full-site coverage, manually paste the script into your Webflow <strong>Site Settings → Global Custom Code</strong>.
      </p>

      <button
        className={styles.button}
        onClick={() => router.push('/select-site')}
      >
        🔁 Inject Again
      </button>
    </main>
  );
}