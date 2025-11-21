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

        <ul className={shellStyles.list}>
          <li>Access tokens are stored in <code>sessionStorage</code> for the current browser session only.</li>
          <li>No tokens are logged or persisted server-side beyond transient request handling.</li>
          <li>Only the Webflow Data (REST) API is used for authorization, site lookup, and Custom Code updates.</li>
          <li>No end-user visitor data is collected.</li>
          <li>You can revoke access anytime from Webflow Apps &amp; Integrations.</li>
        </ul>

        <p className={shellStyles.footer}>
          Questions? <a href="mailto:support@crystalthedeveloper.com">support@crystalthedeveloper.com</a>
        </p>
      </main>
    </div>
  );
}
