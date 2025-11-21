// /pages/api/exchange-token.ts
// curl example:
// curl -X POST https://theme-toggle-webflow.vercel.app/api/exchange-token \
//   -H "Content-Type: application/json" \
//   -d '{"code":"YOUR_CODE"}'

import type { NextApiRequest, NextApiResponse } from 'next';

const WEBFLOW_TOKEN_URL = 'https://api.webflow.com/oauth/access_token';
const REDIRECT_URI = process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI || 'https://theme-toggle-webflow.vercel.app/callback';
const CLIENT_ID = process.env.WEBFLOW_CLIENT_ID || process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID || '';
const CLIENT_SECRET = process.env.WEBFLOW_CLIENT_SECRET || '';

const isPlaceholder = (value: string) =>
  !value ||
  value === 'your_webflow_client_id' ||
  value === 'your_webflow_client_secret';

const truncate = (value: string) => {
  if (!value) return '';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
};

const maskSensitiveFields = (bodyText: string) => {
  try {
    const json = JSON.parse(bodyText);
    if (json.access_token) json.access_token = truncate(json.access_token);
    if (json.refresh_token) json.refresh_token = truncate(json.refresh_token);
    return JSON.stringify(json);
  } catch (err) {
    return bodyText;
  }
};

const logExchange = (
  requestId: string,
  payload: Record<string, unknown>,
  headers: Headers,
  status: number,
  bodyText: string,
) => {
  const responseHeaders = Array.from(headers.entries());
  const entry = {
    timestamp: new Date().toISOString(),
    event: 'webflow_token_exchange',
    request_id: requestId,
    request: {
      url: WEBFLOW_TOKEN_URL,
      client_id: truncate(CLIENT_ID),
    },
    response: {
      status,
      headers: responseHeaders,
      body: maskSensitiveFields(bodyText),
    },
    context: payload,
  };

  console.log(JSON.stringify(entry));
};

const sendError = (
  res: NextApiResponse,
  status: number,
  message: string,
  detail?: unknown,
) => {
  return res.status(status).json({ success: false, message, detail, status });
};

const invalidGrantMessage = () =>
  'invalid_grant received from Webflow. Likely causes: redirect_uri mismatch, expired or reused authorization code, incorrect client_id/client_secret, or double-encoded code parameter.';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed');
  }

  if (isPlaceholder(CLIENT_ID) || isPlaceholder(CLIENT_SECRET)) {
    return sendError(res, 500, 'Server misconfiguration: missing Webflow client credentials. Set WEBFLOW_CLIENT_ID and WEBFLOW_CLIENT_SECRET in the environment.');
  }

  if (!REDIRECT_URI) {
    return sendError(res, 500, 'Server misconfiguration: missing redirect URI.');
  }

  const code = (typeof req.body?.code === 'string' ? req.body.code : '').trim();
  if (!code) {
    return sendError(res, 400, 'Missing authorization code in request body.');
  }

  try {
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    });

    const response = await fetch(WEBFLOW_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Version': '1.0.0',
      },
      body: form.toString(),
    });

    const text = await response.text();
    logExchange(code, { redirect_uri: REDIRECT_URI }, response.headers, response.status, text);

    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (parseErr: any) {
      console.warn('⚠️ Unable to parse token response JSON', parseErr);
    }

    if (!response.ok) {
      if (json?.error === 'invalid_grant') {
        return sendError(res, 400, invalidGrantMessage(), {
          status: response.status,
          body: json,
        });
      }

      return sendError(res, response.status, 'Failed to exchange authorization code with Webflow.', {
        status: response.status,
        body: json || text,
      });
    }

    const { access_token, refresh_token, ...rest } = json || {};
    const site_id = (json && (json.site_id || json?.authorized_user?.site_id)) || '';
    const warning = site_id ? undefined : 'Webflow did not return a site_id in the token response.';

    return res.status(200).json({
      success: true,
      ...rest,
      access_token,
      refresh_token,
      site_id,
      warning,
    });
  } catch (err: any) {
    return sendError(res, 500, 'Unexpected error during token exchange.', err?.message || err);
  }
}
