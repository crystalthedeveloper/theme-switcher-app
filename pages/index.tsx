// pages/index.tsx
import Head from 'next/head';
import styles from './css/app-shell.module.css';
import Logo from '../components/Logo';

export default function Home() {
  const handleExtensionInfo = () => {
    window.open('https://6921ea250e6c6c565ea952a2.webflow-ext.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.shell}>
      <Head>
        <title>Theme Switcher for Webflow</title>
        <meta name="description" content="Dark/light theme toggle for any Webflow site — no-code." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.card}>
        <div className={styles.logoWrap} aria-hidden="true">
          <Logo />
        </div>
        <h1 className={styles.heading}>Theme Switcher</h1>
        <p className={styles.subheading} style={{ maxWidth: '520px' }}>
          Add a dark/light toggle to any Webflow site without coding. Install the app, then enable it in Webflow
          Designer via the Theme Switcher extension.
        </p>

        <div className={styles.controls} style={{ flexDirection: 'column', gap: '12px' }}>
          <button className={styles.buttonPrimary} onClick={handleExtensionInfo}>
            Open Designer Extension
          </button>
          <p className={styles.statusText} style={{ textAlign: 'center' }}>
            Install from the Webflow Apps panel, then open Webflow Designer → Apps → Theme Switcher and click
            “Enable”.
          </p>
        </div>

        <p className={styles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
