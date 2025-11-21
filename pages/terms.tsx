import Head from 'next/head';
import shellStyles from './css/app-shell.module.css';

export default function Terms() {
  return (
    <div className={shellStyles.shell}>
      <Head>
        <title>Terms of Use | Theme Switcher</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={shellStyles.card}>
        <h1 className={shellStyles.heading}>Terms of Use</h1>
        <p className={shellStyles.subheading}>
          By using Theme Switcher you authorize the app to read and update Custom Code on your selected Webflow site(s).
        </p>

        <ul className={shellStyles.list}>
          <li>Permissions are limited to the scopes requested during install.</li>
          <li>You may revoke access at any time via Webflow Apps &amp; Integrations.</li>
          <li>The app updates head/footer Custom Code only to register the Theme Switcher script.</li>
          <li>Use is provided &quot;as is&quot; without warranty; validate changes in your Webflow project.</li>
          <li>Contact support for removals, issues, or questions.</li>
        </ul>

        <p className={shellStyles.footer}>
          Support: <a href="mailto:support@crystalthedeveloper.com">support@crystalthedeveloper.com</a>
        </p>
      </main>
    </div>
  );
}
