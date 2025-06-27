//pages/success.tsx
import Head from 'next/head';
import styles from './css/success.module.css';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Success() {
  return (
    <>
      <Head>
        <title>Installed Successfully</title>
      </Head>
      <main className={styles.success}>
        <Logo />
        <h1>🎉 Theme Switcher Installed!</h1>
        <p>Your script was successfully added to the Webflow footer.</p>
        <a href="https://webflow.com/dashboard/sites" target="_blank" rel="noopener noreferrer">
          <button>Go to Webflow Dashboard</button>
        </a>
        <Footer />
      </main>
    </>
  );
}
