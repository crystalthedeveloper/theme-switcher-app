// pages/success.js


import en from '../locales/en';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const showManualInstall = router.query.manual === 'true';

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: '#111',
    color: '#fff',
    border: '2px solid #000',
    borderRadius: '4px',
    outline: 'none',
  };

  const preBlockStyle = {
    background: '#f4f4f4',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '1rem',
    fontSize: '0.85rem',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <>
      <Head>
        <title>{en.success.title}</title>
        <meta name="description" content={en.success.metaDescription} />
      </Head>
      <main role="main" style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }} aria-live="polite" role="alert">{en.success.heading}</h1>

        <p role="alert" style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '1rem auto' }}>
          {en.success.description}
        </p>

        {showManualInstall && (
          <section aria-label={en.success.manualInstallationAriaLabel} style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#222', marginBottom: '0.5rem' }}>
              {en.success.manualInstallationTitle}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#555' }}>
              {en.success.manualInstallationIntro}
            </p>
            <ol style={{ fontSize: '0.9rem', color: '#444', marginTop: '1rem', paddingLeft: '1.2rem' }}>
              <li>{en.success.manualSteps.step1}</li>
              <li>{en.success.manualSteps.step2}</li>
              <li>{en.success.manualSteps.step3}</li>
            </ol>
            <pre
              aria-label={en.success.scriptAriaLabel}
              style={preBlockStyle}
            >
&lt;script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer&gt;&lt;/script&gt;
            </pre>

            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '2rem' }}>
              {en.success.footerNoteRemoveScript}
              <br /><br />
              {en.success.footerNoteUninstallApp}
            </p>

            <h2 style={{ fontSize: '1.25rem', color: '#222', marginTop: '2rem', marginBottom: '0.5rem' }}>
              Installed via Designer Extension
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#555' }}>
              You’re all set! The Theme Switcher script has been automatically injected using the Designer Extension.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#444', marginTop: '1rem' }}>
              If you ever want to remove it, just uninstall the app from the Webflow “Apps” panel.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '2rem' }}>
              You don’t need to manually paste anything into the Custom Code area.
            </p>
          </section>
        )}

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/" aria-label={en.success.homeAriaLabel}>
            <button style={buttonStyle} aria-label={en.success.homeButtonAriaLabel}>
              {en.success.homeButtonText}
            </button>
          </Link>

          <a
            href="https://webflow.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={en.success.webflowDashboardAriaLabel}
          >
            <button style={buttonStyle} aria-label={en.success.webflowDashboardButtonAriaLabel}>
              {en.success.webflowDashboardButtonText}
            </button>
          </a>
        </div>
      </main>
    </>
  );
}