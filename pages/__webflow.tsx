// pages/__webflow.tsx
import styles from './css/webflow-health.module.css';

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ status: 'ok' }));
  return { props: {} };
}

export default function WebflowHealthCheck() {
  return (
    <main className={styles.container}>
      <img
        src="/logo.png"
        alt="Crystal The Developer Logo"
        className={styles.logo}
      />
      <h1>✅ Theme Switcher Health Check</h1>
      <p>The app is deployed and responding to health checks.</p>
      <p>Status: <strong>OK</strong></p>
      <a href="/" className={styles.link}>
        ← Go to App
      </a>
    </main>
  );
}