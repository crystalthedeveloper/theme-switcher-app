// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const MARKER_START = '<!-- THEME-SWITCHER-START -->';
const MARKER_END = '<!-- THEME-SWITCHER-END -->';
const SCRIPT_BLOCK = [
  MARKER_START,
  '<script>',
  '  // Theme Switcher loader (inserted by app)',
  '  try {',
  "    const theme = localStorage.getItem('theme');",
  '    if (theme) document.documentElement.dataset.theme = theme;',
  '  } catch(e) {}',
  '</script>',
  MARKER_END,
].join('\n');

const API_BASE_PATHS = ['sites', 'dev-sites'] as const;
type ApiBasePath = typeof API_BASE_PATHS[number];

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

const upsertThemeSwitcherScript = (head: string): string => {
  const existingHead = head || '';
  const hasMarkers = existingHead.includes(MARKER_START) && existingHead.includes(MARKER_END);
  if (hasMarkers) {
    const markerPattern = /<!-- THEME-SWITCHER-START -->[\s\S]*?<!-- THEME-SWITCHER-END -->/g;
    return existingHead.replace(markerPattern, SCRIPT_BLOCK);
  }

  const trimmedHead = existingHead.replace(/\s*$/, '');
  if (!trimmedHead) {
    return SCRIPT_BLOCK;
  }

  return `${trimmedHead}\n\n${SCRIPT_BLOCK}`;
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
        'Failed to load existing Custom Code settings',
        customCodeResult.error || 'Custom Code endpoint unavailable',
      );
    }

    const { code: customCode, basePath } = customCodeResult;
    const existingHead = customCode.head || '';
    const nextHead = upsertThemeSwitcherScript(existingHead);

    const apiRes = await fetch(buildApiUrl(basePath, siteId, 'custom-code/settings'), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: {
          head: nextHead,
          footer: customCode.footer || '',
        },
      }),
    });

    const data = await safeJson(apiRes);
    if (!apiRes.ok) return sendError(res, apiRes.status, 'Failed to update head custom code', data);

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return sendError(res, 500, 'Unexpected error', err?.message || err);
  }
}
