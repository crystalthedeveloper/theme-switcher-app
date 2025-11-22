import Head from 'next/head';
import shellStyles from './css/app-shell.module.css';

export default function Privacy() {
  return (
    <div className={shellStyles.shell}>
      <Head>
        <title>Privacy Policy | Theme Switcher</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={shellStyles.card}>
        <h1 className={shellStyles.heading}>Privacy Policy</h1>
        <p className={shellStyles.subheading}>
          We only request the permissions required to register the Theme Switcher script in your Webflow site.
        </p>

        <p className={shellStyles.subheading}>
          Access tokens are stored in sessionStorage for the current browser session only. No tokens are logged or
          persisted server-side beyond transient request handling. Only Webflow authorization APIs are used; no
          end-user visitor data is collected. You can revoke access anytime from Webflow Apps &amp; Integrations.
        </p>

        <p className={shellStyles.footer}>
          Questions? <a href="mailto:contact@crystalthedeveloper.ca">contact@crystalthedeveloper.ca</a>
        </p>
      </main>
    </div>
  );
}
