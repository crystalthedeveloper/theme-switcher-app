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

        <p className={shellStyles.subheading}>
          Permissions are limited to the scopes requested during install. You may revoke access at any time via Webflow
          Apps &amp; Integrations. The app updates head/footer Custom Code only to register the Theme Switcher script.
          Use is provided &quot;as is&quot; without warranty; validate changes in your Webflow project. Contact support
          for removals, issues, or questions.
        </p>

        <p className={shellStyles.footer}>
          Support: <a href="mailto:contact@crystalthedeveloper.ca">contact@crystalthedeveloper.ca</a>
        </p>
      </main>
    </div>
  );
}
