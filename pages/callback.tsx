// pages/callback.tsx
import Head from 'next/head';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en';
import Logo from '../components/Logo';
import shellStyles from './css/app-shell.module.css';
import styles from './css/callback.module.css';

export default function Callback() {
  const router = useRouter();

  // Prevents rendering after success
  const hasFinished = useRef(false);

  // Prevents double execution in React Strict Mode
  const didStart = useRef(false);
  const retriedForCode = useRef(false);

  // Safety timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (didStart.current) return; // Prevent double-run
    didStart.current = true;

    const attemptStart = (isRetry = false) => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code') || '';
      const oauthErr = url.searchParams.get('error') || '';

      if (oauthErr) {
        console.error("❌ OAuth error:", oauthErr);
        fail("Authorization failed.");
        return;
      }

      if (!code) {
        if (!isRetry && !retriedForCode.current) {
          retriedForCode.current = true;
          setTimeout(() => attemptStart(true), 300);
          return;
        }
        console.error("❌ Missing authorization code.");
        fail("Missing authorization code.");
        return;
      }

      runFlow(code);
    };

    attemptStart(false);
  }, [router.isReady]);

  /**
   * Entire OAuth flow — atomic, no React state used mid-process
   */
  const runFlow = async (code: string) => {
    startTimeout();

    try {
      // -------------------------------
      // 1) EXCHANGE TOKEN
      // -------------------------------
      const exchange = await fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!exchange.ok) {
        const text = await exchange.text();
        console.error("❌ Token exchange HTTP failure:", text);
        return fail("Exchange failed.");
      }

      const raw = await exchange.text();
      let json: any = {};
      try {
        json = JSON.parse(raw);
      } catch (err) {
        console.error("❌ Failed to parse exchange JSON:", err);
        return fail("Exchange failed.");
      }

      const access = json.access_token;

      if (!access) {
        return fail("Missing access token.");
      }

      // Mark installed (token is not needed for Designer extension flow)
      const storage = window.sessionStorage;
      storage.setItem('webflow_app_installed', 'true');

      // -------------------------------
      // 2) REDIRECT SAFELY
      // -------------------------------
      successRedirect();

    } catch (err) {
      console.error("❌ Critical callback error:", err);
      fail("Exchange failed.");
    }
  };

  /**
   * Success → stop everything and redirect safely
   */
  const successRedirect = () => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    clearTimeoutIfNeeded();

    // Must use microtask to avoid hydration re-renders
    queueMicrotask(() => {
      window.location.href = '/success';
    });
  };

  /**
   * Failure → show fallback UI without re-running logic
   */
  const fail = (msg: string) => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    clearTimeoutIfNeeded();
    console.error("🛑 FAIL:", msg);
    document.body.innerHTML = `
      <div style="padding:40px;font-family:sans-serif;text-align:center;">
        <h2>Something went wrong</h2>
        <p>${msg}</p>
        <a href="/" style="display:inline-block;margin-top:20px;">
          <button style="padding:10px 18px;border-radius:6px;border:none;background:black;color:white;">
            Try Again
          </button>
        </a>
      </div>
    `;
  };

  const startTimeout = () => {
    timeoutRef.current = setTimeout(() => {
      if (!hasFinished.current) {
        fail("Process timed out.");
      }
    }, 15000);
  };

  const clearTimeoutIfNeeded = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  if (hasFinished.current) return null;

  // Minimal safe render (static)
  return (
    <div className={shellStyles.shell}>
      <Head>
        <title>{en.connecting || "Connecting…"}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={shellStyles.card}>
        <div className={shellStyles.logoWrap}>
          <Logo />
        </div>
        <h1 className={shellStyles.heading}>
          {en.connecting || "Connecting to Webflow…"}
        </h1>

        <p className={shellStyles.statusText}>Please wait…</p>

        <div className={styles.spinner} aria-hidden="true" />
      </main>
    </div>
  );
}
