// pages/api/exchange-token.js

import applyRateLimit from '../../lib/rateLimiter';
import cookie from 'cookie'; // ✅ Make sure this is installed

async function fetchSites(accessToken) {
  try {
    const res = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '2.0.0',
      },
    });

    const raw = await res.text();
    const data = JSON.parse(raw);

    const hostedSites = Array.isArray(data?.sites)
      ? data.sites.filter(site => site?.plan !== 'developer')
      : [];

    return hostedSites.length
      ? { success: true, sites: hostedSites }
      : { success: false, reason: 'No hosted sites found' };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  // await applyRateLimit(req, res);

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const { NEXT_PUBLIC_WEBFLOW_CLIENT_ID: clientId, NEXT_PUBLIC_BASE_URL: baseUrl, WEBFLOW_CLIENT_SECRET: clientSecret } = process.env;
  const redirectUri = `${baseUrl}/callback`;

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({
      error: 'Missing required environment variables',
      details: { clientId: !clientId, clientSecret: !clientSecret, baseUrl: !baseUrl }
    });
  }

  try {
    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const raw = await tokenRes.text();
    let tokenData;

    try {
      tokenData = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: 'Invalid JSON from Webflow',
        hint: 'Check client credentials or redirect URI',
      });
    }

    if (!tokenRes.ok || tokenData?.error || !tokenData?.access_token) {
      return res.status(400).json({
        error: tokenData?.error_description || 'Token exchange failed',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    const siteResult = await fetchSites(accessToken);

    if (!siteResult.success) {
      return res.status(400).json({
        error: 'Failed to fetch sites',
        details: siteResult.reason,
      });
    }

    const siteId = siteResult.sites[0]?._id || siteResult.sites[0]?.id;

    if (!siteId) {
      return res.status(400).json({ error: 'No valid hosted site found' });
    }

    // ✅ Set cookie securely
    res.setHeader('Set-Cookie', cookie.serialize('webflow_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
      sameSite: 'Lax',
    }));

    console.log('✅ Token received, hosted site:', siteId);

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteResult.sites,
      issued_at: Date.now(),
      expires_in: 3600,
    });
  } catch (err) {
    console.error('❌ Exchange error:', err);
    return res.status(500).json({
      error: 'Unexpected error during token exchange',
      message: err?.message || 'Unknown error',
    });
  }
}