// pages/success.js


import en from '../locales/en';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './css/success.module.css';

export default function Success() {
  const router = useRouter();
  const showManualInstall = router.query.manual === 'true';

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

        {showManualInstall && (
          <section aria-label="Manual installation steps" className={styles.manualSection}>
            <h2 className={styles.manualTitle}>
              Need to Add the Script Manually?
            </h2>
            <p className={styles.manualIntro}>
              Follow these steps to manually add the Theme Switcher script to your Webflow site.
            </p>
            <ol className={styles.manualSteps}>
              <li>Go to your Webflow site’s settings &gt; Custom Code tab.</li>
              <li>Paste the script below into the Footer Code section.</li>
            </ol>
            <p className={styles.publishNote}>
              Then click ‘Save’ and publish your site.
            </p>
            <pre
              aria-label="Script code block"
              className={styles.preBlock}
            >
&lt;script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer&gt;&lt;/script&gt;
            </pre>

            <p className={styles.notes}>
              You can remove this script anytime by deleting it from the Custom Code section.
              <br /><br />
              Uninstalling the app will not automatically remove this script if you added it manually.
            </p>

            <h2 className={styles.installedTitle}>
              Installed via Designer Extension
            </h2>
            <p className={styles.installedInfo}>
              The Theme Switcher app has been automatically installed using the Designer Extension.
            </p>
            <p className={styles.installedNote}>
              If you ever want to remove it, just uninstall the app from the Webflow “Apps” panel.
            </p>
            <p className={styles.noManualPaste}>
              You don’t need to manually paste anything into the Custom Code area.
            </p>
          </section>
        )}

        <div className={styles.buttonRow}>
          <Link href="/" aria-label={en.success.homeAriaLabel}>
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