// pages/success.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './css/success.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const scriptTag = `
<!-- Theme Switcher injected by app -->
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
`;

export default function Success() {
  const router = useRouter();
  const { query } = router;
  const [isManual, setIsManual] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    if (query.manual === 'true') {
      setIsManual(true);
    }
  }, [query]);

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopyFeedback('📋 Script copied manually!');
    } catch (err) {
      setCopyFeedback('❌ Copy failed');
    }
    document.body.removeChild(textarea);
  };

  const handleCopyScript = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(scriptTag)
        .then(() => setCopyFeedback('📋 Script copied! Paste it into Site Settings → Footer.'))
        .catch((err) => {
          console.error('❌ Clipboard API error:', err);
          fallbackCopy(scriptTag);
        });
    } else {
      fallbackCopy(scriptTag);
    }
  };

  return (
    <main className={styles.container} aria-labelledby="success-heading">
      <Logo />

      <h1 id="success-heading" className={styles.heading}>🎉 All Set!</h1>

      {isManual ? (
        <>
          <p className={styles.message} role="alert">
            ⚠️ We couldn't inject the script automatically.
          </p>
          <button
            className={styles.button}
            onClick={() => router.push('/select-site')}
            aria-label="Try injecting again"
          >
            🔁 Inject Again
          </button>
        </>
      ) : (
        <p className={styles.message} role="status">
          ✅ Theme Switcher was successfully injected into your page!
          <br />
          You can always revisit this page to re-inject if needed.
        </p>
      )}

      <p className={styles.note}>
        💡 For full-site coverage, manually paste the script into your Webflow <strong>Site Settings → Global Custom Code</strong>.
      </p>

      <div className={styles['button-group']}>
        <button
          className={styles['main-button']}
          onClick={handleCopyScript}
          aria-label="Copy script tag to clipboard"
        >
          📋 Copy Script Tag
        </button>
      </div>

      {copyFeedback && <p className={styles.feedback} role="status">{copyFeedback}</p>}
      <Footer />
    </main>
  );
}