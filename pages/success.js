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
        <meta name="description" content="Your Theme Switcher script has been successfully installed in Webflow." />
      </Head>
      <main role="main" className={styles.main}>
        <h1 className={styles.heading} aria-live="polite" role="alert">The Theme Switcher App Has Been Installed</h1>

        <p role="alert" className={styles.message}>
          The Theme Switcher app has been installed on your Webflow site.
        </p>

        <div className={styles.buttonRow}>
          <Link href="https://theme-switcher-app.webflow.io/" aria-label={en.success.homeAriaLabel}>
            <button className={styles.button} aria-label={en.success.homeButtonAriaLabel}>
              {en.success.homeButtonText}
            </button>
          </Link>

          <a
            href="https://webflow.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={en.success.webflowDashboardAriaLabel}
          >
            <button className={styles.button} aria-label={en.success.webflowDashboardButtonAriaLabel}>
              {en.success.webflowDashboardButtonText}
            </button>
          </a>
        </div>
      </main>
    </>
  );
}