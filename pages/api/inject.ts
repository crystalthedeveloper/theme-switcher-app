// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const THEME_SWITCHER_MARKER = 'data-theme-switcher="true"';
const API_BASE_PATHS = ['sites', 'dev-sites'] as const;
type ApiBasePath = typeof API_BASE_PATHS[number];

type WebflowDomainResponse = {
  domains?: Array<{ name?: string; value?: string; domain?: string }>;
  items?: Array<{ name?: string; value?: string; domain?: string }>;
};

type CustomCodeSettingsResponse = {
  code?: {
    head?: string;
    footer?: string;
  };
};

const extractDetail = (extra: unknown): string | undefined => {
  if (!extra) return undefined;
  if (typeof extra === 'string') return extra;
  if (typeof extra === 'number' || typeof extra === 'boolean') return String(extra);
  if (extra instanceof Error) return extra.message;
  if (typeof extra === 'object') {
    const record = extra as Record<string, unknown>;
    const maybeMessage = record.message;
    if (typeof maybeMessage === 'string') return maybeMessage;
    const items = record.items;
    if (Array.isArray(items) && items.length > 0) {
      const first = items[0] as Record<string, unknown> | undefined;
      const firstItemMessage = first?.message;
      if (typeof firstItemMessage === 'string') return firstItemMessage;
    }
  }
  try {
    return JSON.stringify(extra);
  } catch (err) {
    console.warn('⚠️ Unable to serialize error detail', err);
    return undefined;
  }
};

const sendError = (
  res: NextApiResponse,
  status: number,
  message: string,
  extra?: unknown,
) => {
  const detail = extractDetail(extra);
  console.warn(`⚠️ ${status} – ${message}${detail ? ` (${detail})` : ''}`);
  if (extra && typeof extra !== 'string') console.error(extra);
  return res.status(status).json({ success: false, message, detail });
};

const buildApiUrl = (basePath: ApiBasePath, siteId: string, endpoint: string) =>
  `https://api.webflow.com/v2/${basePath}/${siteId}/${endpoint}`.replace(/\/+$/, '');

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

const tryFetchWithFallback = async (
  siteId: string,
  token: string,
  endpoint: string,
  init: RequestInit,
  preferredBasePath?: ApiBasePath,
) => {
  const order: ApiBasePath[] = preferredBasePath
    ? [preferredBasePath, ...API_BASE_PATHS.filter((path) => path !== preferredBasePath)]
    : [...API_BASE_PATHS];

  let lastResult: { response: Response; data: any; basePath: ApiBasePath } | null = null;

  for (const basePath of order) {
    const response = await fetch(buildApiUrl(basePath, siteId, endpoint), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        ...(init.headers || {}),
      },
    });

    const data = await safeJson(response);
    lastResult = { response, data, basePath };

    if (response.status === 404 && basePath !== order[order.length - 1]) {
      console.warn(`⚠️ ${endpoint} not found on ${basePath}; trying alternate path.`);
      continue;
    }

    return lastResult;
  }

  return lastResult;
};

const loadCurrentCustomCode = async (
  siteId: string,
  token: string,
) => {
  try {
    const result = await tryFetchWithFallback(siteId, token, 'custom-code/settings', { method: 'GET' });

    if (!result) {
      console.warn('⚠️ Custom code fetch returned no result');
      return { code: { head: '', footer: '' }, basePath: API_BASE_PATHS[0] };
    }

    if (!result.response.ok) {
      console.warn('⚠️ Failed to load custom code settings', result.response.status, result.data);
      return { code: undefined, basePath: result.basePath, error: result.data };
    }

    const payload = (result.data as CustomCodeSettingsResponse | null) || null;
    return { code: payload?.code || { head: '', footer: '' }, basePath: result.basePath };
  } catch (err) {
    console.warn('⚠️ Custom code fetch errored', err);
    return { code: { head: '', footer: '' }, basePath: API_BASE_PATHS[0], error: err };
  }
};

const fetchCustomDomains = async (
  siteId: string,
  token: string,
  preferredBasePath: ApiBasePath,
): Promise<string[]> => {
  try {
    const result = await tryFetchWithFallback(siteId, token, 'domains', { method: 'GET' }, preferredBasePath);

    if (!result) return [];

    if (!result.response.ok) {
      console.warn('⚠️ Unable to load Webflow domains', result.response.status, result.data);
      return [];
    }

    const payload = (result.data as WebflowDomainResponse | null) || null;
    const collection = payload?.domains || payload?.items;

    if (!Array.isArray(collection)) return [];

    return collection
      .map((entry) => (entry?.domain || entry?.name || entry?.value || '').trim().toLowerCase())
      .filter(Boolean);
  } catch (err) {
    console.warn('⚠️ Domain fetch failed', err);
    return [];
  }
};

const removeExistingThemeScript = (footer: string): string => {
  if (!footer) return '';
  const pattern = /<script[^>]*data-theme-switcher=["']true["'][^>]*>[\s\S]*?<\/script>/gi;
  const cleaned = footer.replace(pattern, '');
  return cleaned.trim();
};

const buildThemeSwitcherInlineScript = (customDomains: string[]): string => {
  const domainsJson = JSON.stringify(customDomains);
  return `
<script ${THEME_SWITCHER_MARKER}>
(function () {
  'use strict';

  const hostname = (window.location.hostname || '').toLowerCase();
  const allowedSuffixes = ['.webflow.io', '.canvas.webflow.com'];
  const allowedDomains = new Set(${domainsJson});
  const isSuffixMatch = allowedSuffixes.some((suffix) => hostname === suffix.replace(/^\./, '') || hostname.endsWith(suffix));
  const isCustomMatch = allowedDomains.has(hostname);

  if (!isSuffixMatch && !isCustomMatch) {
    console.warn('[Theme Switcher] Skipping init on unauthorized domain:', hostname);
    return;
  }

  const safeStorage = () => {
    try {
      const storage = window.localStorage;
      const probeKey = '__theme_switcher_probe__';
      storage.setItem(probeKey, '1');
      storage.removeItem(probeKey);
      return storage;
    } catch (err) {
      console.warn('[Theme Switcher] localStorage unavailable', err);
      return null;
    }
  };

  const run = () => {
    const root = document.documentElement;
    if (!root) {
      console.warn('[Theme Switcher] Missing documentElement; aborting init.');
      return;
    }

    const storage = safeStorage();
    const storageKey = 'theme-switcher-mode';
    const systemMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const getSystemTheme = () => (systemMedia && systemMedia.matches ? 'dark' : 'light');

    const defaultTheme = (root.getAttribute('data-theme-default') || root.getAttribute('data-theme') || 'light').trim() || 'light';

    const resolveTheme = (mode) => {
      if (mode === 'auto') return getSystemTheme();
      if (!mode || mode === 'default') return defaultTheme;
      return mode;
    };

    let currentMode = (storage && storage.getItem(storageKey)) || defaultTheme;

    const applyTheme = (mode, persist = true) => {
      currentMode = mode;
      const theme = resolveTheme(mode);
      root.setAttribute('data-theme', theme);
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
      }
      if (persist && storage) {
        storage.setItem(storageKey, mode);
      }
    };

    applyTheme(currentMode, false);

    const toggles = Array.prototype.slice.call(document.querySelectorAll('[data-switcher], [data-toggle], [data-theme-target]'));

    const getTargetMode = (el) => {
      const attr = (el.getAttribute('data-theme-target') || el.getAttribute('data-theme') || el.getAttribute('data-toggle') || el.getAttribute('data-switcher') || '').trim().toLowerCase();
      if (!attr) return null;
      if (attr === 'toggle') {
        const activeTheme = root.getAttribute('data-theme') || defaultTheme;
        return activeTheme === 'dark' ? 'light' : 'dark';
      }
      return attr;
    };

    const syncToggleState = () => {
      toggles.forEach((el) => {
        const attr = (el.getAttribute('data-theme-target') || el.getAttribute('data-theme') || el.getAttribute('data-toggle') || el.getAttribute('data-switcher') || '').trim().toLowerCase();
        const theme = resolveTheme(currentMode);
        const isActive = attr === currentMode || (attr === theme && currentMode !== 'auto');
        if (isActive) {
          el.setAttribute('aria-pressed', 'true');
          if (typeof el.classList !== 'undefined') {
            el.classList.add('theme-switcher-active');
          }
        } else {
          el.setAttribute('aria-pressed', 'false');
          if (typeof el.classList !== 'undefined') {
            el.classList.remove('theme-switcher-active');
          }
        }
      });
    };

    toggles.forEach((el) => {
      el.addEventListener('click', (event) => {
        try {
          event.preventDefault();
        } catch (err) {
          // Ignore if preventDefault fails
        }

        const targetMode = getTargetMode(el);
        if (!targetMode) {
          console.warn('[Theme Switcher] Toggle missing target mode');
          return;
        }

        if (targetMode === 'auto') {
          applyTheme('auto');
        } else if (targetMode === 'light' || targetMode === 'dark') {
          applyTheme(targetMode);
        } else {
          applyTheme(defaultTheme);
        }

        syncToggleState();
      });
    });

    if (systemMedia && typeof systemMedia.addEventListener === 'function') {
      systemMedia.addEventListener('change', () => {
        if (currentMode === 'auto') {
          applyTheme('auto', false);
          syncToggleState();
        }
      });
    } else if (systemMedia && typeof systemMedia.addListener === 'function') {
      systemMedia.addListener(() => {
        if (currentMode === 'auto') {
          applyTheme('auto', false);
          syncToggleState();
        }
      });
    }

    syncToggleState();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
</script>
`.trim();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method Not Allowed');

  const { siteId } = req.body as { siteId?: string };
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!siteId || !token) return sendError(res, 400, 'Missing siteId or token');

  try {
    const customCodeResult = await loadCurrentCustomCode(siteId, token);

    if (!customCodeResult.code) {
      return sendError(
        res,
        404,
        'Failed to load Existing Custom Code settings',
        customCodeResult.error || 'Custom Code endpoint unavailable',
      );
    }

    const { code: customCode, basePath } = customCodeResult;
    const customDomains = await fetchCustomDomains(siteId, token, basePath);

    const scriptTag = buildThemeSwitcherInlineScript(customDomains);
    const existingFooter = customCode.footer || '';
    const sanitizedFooter = removeExistingThemeScript(existingFooter);
    const nextFooter = [sanitizedFooter, scriptTag].filter(Boolean).join('\n\n').trim();

    const apiRes = await fetch(buildApiUrl(basePath, siteId, 'custom-code/settings'), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: {
          head: customCode.head || '',
          footer: nextFooter,
        },
      }),
    });

    const data = await apiRes.json();
    if (!apiRes.ok) return sendError(res, apiRes.status, 'Failed to inject footer script', data);

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return sendError(res, 500, 'Unexpected error', err?.message || err);
  }
}
