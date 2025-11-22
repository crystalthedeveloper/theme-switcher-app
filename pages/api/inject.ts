// /pages/api/inject.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const MARKER_START = '<!-- THEME-SWITCHER-START -->';
const MARKER_END = '<!-- THEME-SWITCHER-END -->';
const SCRIPT_BLOCK = [
  MARKER_START,
  '<script>',
  '  try {',
  "    const t = localStorage.getItem('theme');",
  '    if (t) document.documentElement.dataset.theme = t;',
  "    window.__themeSwitcherInstalled = true;",
  "  } catch(e) { console.warn('theme loader', e); }",
  '</script>',
  MARKER_END,
].join('\n');

const ACCEPT_VERSION = '1.0.0';
const HEAD_SIZE_LIMIT_BYTES = 200 * 1024;
const RETRY_DELAYS = [0, 300, 1000, 3000];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mergeHead = (currentHead: string): string => {
  const existingHead = currentHead || '';
  const pattern = new RegExp(`${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`, 'g');

  if (pattern.test(existingHead)) {
    return existingHead.replace(pattern, SCRIPT_BLOCK);
  }

  if (!existingHead.trim()) {
    return SCRIPT_BLOCK;
  }

  return `${existingHead.replace(/\s*$/, '')}\n\n${SCRIPT_BLOCK}`;
};

const truncateToken = (token: string) => {
  if (!token) return '';
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
};

const maskHeaders = (headers: Record<string, string>, token: string) => ({
  ...headers,
  Authorization: `Bearer ${truncateToken(token)}`,
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (status: number) => status === 429 || status >= 500;

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

const logExchange = async (
  siteId: string,
  token: string,
  url: string,
  method: string,
  headers: Record<string, string>,
  bodySize: number,
  response: Response,
  responseBody: string,
  attempt: number,
) => {
  const headerEntries = Array.from(response.headers.entries());
  const requestId = response.headers.get('x-request-id') || response.headers.get('x-amzn-trace-id');

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    site_id: siteId,
    request_url: url,
    method,
    attempt,
    request_headers: maskHeaders(headers, token),
    request_body_size_bytes: bodySize,
    response_status: response.status,
    response_headers: headerEntries,
    response_body: responseBody,
    token_truncated: truncateToken(token),
  };

  if (requestId) entry.request_id = requestId;

  console.log(JSON.stringify(entry));
};

const fetchWithRetries = async (
  siteId: string,
  token: string,
  url: string,
  init: RequestInit,
) => {
  let lastResponse: Response | null = null;
  let lastBody = '';
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt += 1) {
    if (attempt > 0) await wait(RETRY_DELAYS[attempt]);

    const headers = { ...(init.headers as Record<string, string>) };
    const bodySize = init.body ? Buffer.byteLength(String(init.body), 'utf8') : 0;
    try {
      const response = await fetch(url, init);
      const text = await response.text();
      await logExchange(siteId, token, url, init.method || 'GET', headers, bodySize, response, text, attempt + 1);

      lastResponse = response;
      lastBody = text;

      if (!shouldRetry(response.status)) {
        return { response, text };
      }
    } catch (err: any) {
      console.warn('⚠️ Fetch error', { url, attempt: attempt + 1, message: err?.message || err });
      if (attempt === RETRY_DELAYS.length - 1) throw err;
    }
  }

  if (!lastResponse) {
    throw new Error('Request failed without response');
  }

  return { response: lastResponse, text: lastBody };
};

type CustomCodePayload = { head?: string; footer?: string };

const customCodeUrl = (siteId: string) => `https://api.webflow.com/v1/sites/${siteId}/customcode`;

const fetchCurrentCustomCode = async (siteId: string, token: string): Promise<CustomCodePayload> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'accept-version': ACCEPT_VERSION,
  };

  const { response, text } = await fetchWithRetries(siteId, token, customCodeUrl(siteId), { method: 'GET', headers });

  if (!response.ok) {
    console.warn('⚠️ Unable to read existing custom code; proceeding with empty head', {
      status: response.status,
      body: text,
    });
    return { head: '', footer: '' };
  }

  const payload = (await safeJson(
    new Response(text, { headers: { 'Content-Type': 'application/json' } }),
  )) as CustomCodePayload | null;

  return payload || { head: '', footer: '' };
};

const patchCustomCode = async (siteId: string, token: string, head: string, footer: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'accept-version': ACCEPT_VERSION,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({ head, footer });
  return fetchWithRetries(siteId, token, customCodeUrl(siteId), {
    method: 'PATCH',
    headers,
    body,
  });
};

const sendError = (
  res: NextApiResponse,
  status: number,
  message: string,
  detail?: unknown,
) => {
  return res.status(status).json({ success: false, message, detail, status });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed');
  }

  const siteId = req.body?.siteId as string | undefined;
  const isTest = req.query.test === 'true' || req.body?.test === true;
  const token = req.headers.authorization?.replace('Bearer ', '') || process.env.SERVICE_TOKEN || '';

  if (!siteId) return sendError(res, 400, 'Missing siteId');
  if (!token) return sendError(res, 401, 'Missing access token');

  try {
    const current = await fetchCurrentCustomCode(siteId, token);
    const currentHead = current.head || '';
    const currentFooter = current.footer || '';
    const mergedHead = mergeHead(currentHead);

    if (Buffer.byteLength(mergedHead, 'utf8') > HEAD_SIZE_LIMIT_BYTES) {
      return sendError(
        res,
        413,
        'Merged head exceeds 200KB limit. Host larger scripts externally and keep loader minimal.'
      );
    }

    if (isTest) {
      return res.status(200).json({ success: true, simulated: true, previewHtml: mergedHead });
    }

    if (mergedHead === currentHead) {
      return res.status(200).json({ success: true, message: 'No change; marker already present' });
    }

    const { response: patchResponse, text: patchText } = await patchCustomCode(
      siteId,
      token,
      mergedHead,
      currentFooter || '',
    );

    if (!patchResponse.ok) {
      const detail = patchText || 'Unknown error';
      return sendError(res, patchResponse.status, 'Script registration failed', detail);
    }

    const parsedPatch =
      (await safeJson(new Response(patchText, { headers: { 'Content-Type': 'application/json' } }))) || patchText;

    return res
      .status(200)
      .json({ success: true, message: 'Injected/updated script', result: parsedPatch });
  } catch (err: any) {
    return sendError(res, 500, 'Script registration failed', err?.message || err);
  }
}
