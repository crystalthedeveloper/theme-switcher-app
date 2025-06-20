// pages/success.js

import en from '../locales/en';
import Head from 'next/head';
import Link from 'next/link';
import styles from './css/success.module.css';

export default function Success() {

  return (
    <>
      <Head>
        <title>Success – Theme Switcher Installed</title>
        <meta name="description" content={en.success.metaDescription} />
      </Head>
      <main role="main" className={styles.main}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          role="img"
          aria-label="Logo of Crystal The Developer"
          className={styles.logo}
        />
        <h1 className={styles['main-heading']} aria-live="polite" role="alert">Success! 🎉</h1>
        <h2 className={styles['main-heading']} aria-live="polite" role="alert">The Theme Switcher App Has Been Installed</h2>

        <p role="alert" className={styles.message}>
          The Theme Switcher app has been installed on your Webflow site.
        </p>

        <div className={styles.buttonRow}>
          <Link href="https://theme-switcher-app.webflow.io/" aria-label={en.success.homeAriaLabel}>
            <button className={styles.button} aria-label={'Go back to homepage'}>
              {en.success.buttonHome}
            </button>
          </Link>

          <a
            href="https://webflow.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={en.success.webflowDashboardAriaLabel}
          >
            <button className={styles.button} aria-label={'Open Webflow Dashboard'}>
              {en.success.buttonWebflowDashboard}
            </button>
          </a>
        </div>
      </main>
    </>
  );
}