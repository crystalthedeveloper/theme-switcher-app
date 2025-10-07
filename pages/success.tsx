// pages/success.tsx
import Head from 'next/head';
import shellStyles from './css/app-shell.module.css';
import Logo from '../components/Logo';

export default function Success() {
  return (
    <div className={shellStyles.shell}>
      <Head>
        <title>Theme Switcher Installed</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={shellStyles.card}>
        <div className={shellStyles.logoWrap} aria-hidden="true">
          <Logo />
        </div>

        <h1 className={shellStyles.heading}>Theme Switcher Installed</h1>
        <p className={shellStyles.subheading}>
          Your Webflow site is now powered by Theme Switcher. Reopen the app anytime to refresh the script or update
          your settings.
        </p>

        <div className={shellStyles.controls}>
          <a href="https://webflow.com/dashboard/sites" target="_blank" rel="noopener noreferrer">
            <button className={shellStyles.buttonPrimary}>Go to Webflow Dashboard</button>
          </a>
        </div>

        <p className={shellStyles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
