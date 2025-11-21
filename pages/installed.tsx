// pages/installed.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from './css/app-shell.module.css';
import Logo from '../components/Logo';
import { useRouter } from 'next/router';

export default function Installed() {
  const router = useRouter();

  const [injecting, setInjecting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');
  const [workspaceGroups, setWorkspaceGroups] = useState<
    Array<{ id: string; name: string; sites: Array<{ id: string; name: string }> }>
  >([]);
  const [ungroupedSites, setUngroupedSites] = useState<Array<{ id: string; name: string }>>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState('');

  useEffect(() => {
    const storage = window.sessionStorage;

    const queryToken = router.query.token as string;
    const querySiteId = router.query.siteId as string;

    if (queryToken) {
      setToken(queryToken);
      if (querySiteId) {
        setSiteId(querySiteId);
        setSelectedSiteId(querySiteId);
      }
      setDebugMode(true);
    } else {
      const t = storage?.getItem('webflow_token') || '';
      const s = storage?.getItem('webflow_site_id') || '';

      if (t) {
        setToken(t);
      }
      if (s) {
        setSiteId(s);
        setSelectedSiteId(s);
      }
      const registrationStatus = storage?.getItem('webflow_last_registration');
      if (registrationStatus === 'success') {
        setAutoMessage('✅ Theme Switcher script was registered automatically.');
        storage.removeItem('webflow_last_registration');
      }
    }

    setLoaded(true);
  }, [router.query]);

  useEffect(() => {
    if (!token) return;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError('');
        const response = await fetch('/api/sites', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load sites');
        }

        const workspaceList = Array.isArray(data.workspaces) ? data.workspaces : [];
        const ungroupedList = Array.isArray(data.ungrouped) ? data.ungrouped : [];

        setWorkspaceGroups(
          workspaceList.map((workspace: any) => ({
            id: workspace.id,
            name: workspace.name,
            sites: Array.isArray(workspace.sites)
              ? workspace.sites.map((site: any) => ({ id: site.id, name: site.name }))
              : [],
          })),
        );
        setUngroupedSites(ungroupedList.map((item: any) => ({ id: item.id, name: item.name })));

        const flattenedPreferredList = workspaceList
          .flatMap((workspace: any) => workspace.sites || [])
          .concat(ungroupedList);

        if (!flattenedPreferredList.some((item: any) => item.id === selectedSiteId) && flattenedPreferredList.length > 0) {
          const preferred = flattenedPreferredList.find((item: any) => item.id === siteId) || flattenedPreferredList[0];
          setSelectedSiteId(preferred.id);
          window.sessionStorage?.setItem('webflow_site_id', preferred.id);
        }
      } catch (err: any) {
        console.warn('⚠️ Failed to fetch sites:', err);
        setSitesError(err?.message || 'Unable to load accessible sites');
      } finally {
        setSitesLoading(false);
      }
    };

    loadSites();
  }, [token, siteId]);

  const handleInjectClick = async () => {
    const targetSiteId = selectedSiteId || siteId;
    if (!token || !targetSiteId) {
      console.warn('❌ Cannot inject — missing token or siteId:', { token, targetSiteId });
      setMessage('❌ Missing token or site ID.');
      return;
    }

    setInjecting(true);
    setMessage('');
    setAutoMessage('');

    try {
      const res = await fetch('/api/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ siteId: targetSiteId }),
      });

      const data = await res.json();
      setMessage(data.success ? '✅ Theme Switcher script refreshed!' : `❌ ${data.message || 'Injection failed'}`);
    } catch (err) {
      console.error('❌ Injection error:', err);
      setMessage('❌ Script injection error.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className={styles.shell}>
      <Head>
        <title>Theme Switcher Installed</title>
        <meta name="description" content="Theme Switcher has been successfully installed in Webflow." />
      </Head>

      <main className={styles.card} aria-busy={injecting}>
        <div className={styles.logoWrap} aria-hidden="true">
          <Logo />
        </div>
        <h1 className={styles.heading}>
          Theme Switcher
          <span className={styles.badgeInstalled}>Installed</span>
        </h1>
        <p className={styles.subheading}>
          Your Webflow site now ships with Theme Switcher. Manage credentials or refresh the script below.
        </p>

        {!loaded ? (
          <p className={styles.statusText}>Loading credentials…</p>
        ) : (
          <>
            <div className={styles.inputs}>
              <input
                type="text"
                placeholder="Webflow token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <select
                value={selectedSiteId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedSiteId(next);
                  setSiteId(next);
                  window.sessionStorage?.setItem('webflow_site_id', next);
                }}
              >
                <option value="">Select a Webflow site…</option>
                {workspaceGroups.map((workspace) => (
                  <optgroup key={workspace.id} label={workspace.name}>
                    {workspace.sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {workspaceGroups.length > 0 && ungroupedSites.length > 0 ? (
                  <optgroup label="Other Sites">
                    {ungroupedSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  ungroupedSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))
                )}
              </select>
              {sitesLoading && <p style={{ color: '#555', fontSize: '0.9rem' }}>Loading sites…</p>}
              {sitesError && (
                <p style={{ color: '#b00000', fontSize: '0.9rem' }} role="alert">
                  {sitesError}
                </p>
              )}
            </div>

            <div className={styles.controls}>
              <button
                className={styles.buttonPrimary}
                onClick={handleInjectClick}
                disabled={injecting || !token || !selectedSiteId}
              >
                {injecting ? 'Refreshing…' : 'Re-register Theme Switcher Script'}
              </button>
            </div>
          </>
        )}

        {autoMessage && !message && (
          <p className={styles.autoMessage} role="status">
            {autoMessage}
          </p>
        )}

        {message && (
          <p className={message.startsWith('✅') ? styles.autoMessage : styles.errorMessage} role="alert">
            {message}
          </p>
        )}

        <div style={{ marginTop: '2rem', fontSize: '0.95rem', color: '#444' }}>
          <p>
            Need help? <a href="mailto:support@crystalthedeveloper.com">Email support</a>.
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Use</a>
          </p>
        </div>

        {debugMode && (
          <div className={styles.testBadge}>
            ⚙️ Debug mode active (from query string)
          </div>
        )}

        <p className={styles.footer}>© 2025 Crystal The Developer Inc. All rights reserved.</p>
      </main>
    </div>
  );
}
