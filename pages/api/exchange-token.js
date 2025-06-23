// pages/api/exchange-token.js

import applyRateLimit from '../../lib/rateLimiter';
import cookie from 'cookie';

async function fetchSites(accessToken) {
  try {
    console.log('🔍 Fetching sites with accessToken:', accessToken.slice(0, 5) + '...');
    const res = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '2.0.0',
      },
    });

    const raw = await res.text();

    if (raw.startsWith('<')) {
      console.error('❌ HTML response from Webflow (likely invalid token):', raw.slice(0, 300));
      return { success: false, reason: 'Received HTML instead of JSON when fetching sites.' };
    }

    const data = JSON.parse(raw);
    console.log('✅ Sites fetched:', data);

    const hostedSites = Array.isArray(data?.sites)
      ? data.sites.filter(site => site?.plan !== 'developer')
      : [];

    return hostedSites.length
      ? { success: true, sites: hostedSites }
      : { success: false, reason: 'No hosted sites found' };
  } catch (err) {
    console.error('❌ fetchSites error:', err);
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

  const {
    NEXT_PUBLIC_WEBFLOW_CLIENT_ID: clientId,
    NEXT_PUBLIC_BASE_URL: baseUrl,
    WEBFLOW_CLIENT_SECRET: clientSecret,
  } = process.env;

  console.log('🔑 Environment Variables:', {
    clientIdLoaded: !!clientId,
    baseUrlLoaded: !!baseUrl,
    clientSecretLoaded: !!clientSecret,
  });

  const redirectUri = `${baseUrl}/callback`;
  console.log('🔁 Redirect URI:', redirectUri);

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({
      error: 'Missing required environment variables',
      details: { clientId: !clientId, clientSecret: !clientSecret, baseUrl: !baseUrl },
    });
  }

  try {
    console.log('🔄 Requesting access token from Webflow...');
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

    if (raw.startsWith('<')) {
      console.error('❌ HTML error from Webflow (token exchange):', raw.slice(0, 300));
      return res.status(500).json({
        error: 'Received unexpected HTML response from Webflow',
        html: raw.slice(0, 300),
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(raw);
      console.log('✅ Token response from Webflow:', tokenData);
    } catch (err) {
      console.error('❌ Failed to parse token JSON:', raw.slice(0, 300));
      return res.status(500).json({
        error: 'Invalid JSON from Webflow token endpoint',
        raw: raw.slice(0, 300),
      });
    }

    if (!tokenRes.ok || tokenData?.error || !tokenData?.access_token) {
      console.error('⚠️ Webflow token error response:', tokenData);
      return res.status(400).json({
        error: tokenData?.error_description || 'Token exchange failed',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    console.log('🔐 Access token received:', accessToken.slice(0, 10) + '...');

    const siteResult = await fetchSites(accessToken);

    if (!siteResult.success) {
      console.error('❌ Failed to fetch sites:', siteResult.reason);
      return res.status(400).json({
        error: 'Failed to fetch sites',
        details: siteResult.reason,
      });
    }

    const siteId = siteResult.sites[0]?._id || siteResult.sites[0]?.id;
    if (!siteId) {
      console.error('❌ No valid hosted site ID found');
      return res.status(400).json({ error: 'No valid hosted site found' });
    }

    res.setHeader('Set-Cookie', cookie.serialize('webflow_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
      sameSite: 'Lax',
    }));

    console.log('✅ Final token exchange complete. Site ID:', siteId);

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteResult.sites,
      issued_at: Date.now(),
      expires_in: 3600,
    });
  } catch (err) {
    console.error('❌ Exchange error (outer catch):', err);
    return res.status(500).json({
      error: 'Unexpected error during token exchange',
      message: err?.message || 'Unknown error',
    });
  }
}