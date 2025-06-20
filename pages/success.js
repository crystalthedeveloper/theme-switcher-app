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
      <main className={styles.main}>
        <img
          src="/logo.png"
          alt="Crystal The Developer Logo"
          className={styles.logo}
        />
        <h1 className={styles['main-heading']}>The Theme Switcher App Has Been Installed</h1>

        <p className={styles.message}>
          {en.success.description}
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