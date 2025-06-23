// pages/api/exchange-token.js

import cookie from 'cookie';

async function fetchSites(accessToken) {
  if (!accessToken) {
    console.error('❌ Missing access token for fetchSites');
    return { success: false, reason: 'Missing access token' };
  }

  try {
    console.log('🔍 Fetching sites with token:', accessToken.slice(0, 6) + '...');
    const res = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '2.0.0',
      },
    });

    const raw = await res.text();
    if (raw.startsWith('<')) {
      console.error('❌ HTML response from Webflow (invalid token?):', raw.slice(0, 300));
      return { success: false, reason: 'Received HTML instead of JSON' };
    }

    const data = JSON.parse(raw);
    console.log('✅ Sites fetched:', data?.sites?.length ?? 0);

    const hostedSites = (data?.sites || []).filter(site => site.plan !== 'developer');

    return hostedSites.length
      ? { success: true, sites: hostedSites }
      : { success: false, reason: 'No hosted sites found' };
  } catch (err) {
    console.error('❌ Error fetching sites:', err);
    return { success: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const {
    WEBFLOW_CLIENT_ID: clientId,
    WEBFLOW_CLIENT_SECRET: clientSecret,
    WEBFLOW_REDIRECT_URI: redirectUri,
  } = process.env;

  console.log('🌐 Env check:', {
    clientId: !!clientId,
    clientSecret: !!clientSecret,
    redirectUri,
  });

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
      error: 'Missing required environment variables',
      details: {
        WEBFLOW_CLIENT_ID: !!clientId,
        WEBFLOW_CLIENT_SECRET: !!clientSecret,
        WEBFLOW_REDIRECT_URI: !!redirectUri,
      },
    });
  }

  try {
    console.log('🔄 Requesting Webflow access token...');
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
      console.error('❌ Unexpected HTML from token endpoint:', raw.slice(0, 300));
      return res.status(500).json({ error: 'HTML instead of JSON from token endpoint', html: raw });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(raw);
    } catch (parseErr) {
      console.error('❌ Failed to parse JSON from Webflow:', raw.slice(0, 300));
      return res.status(500).json({ error: 'Invalid JSON in token response', raw });
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('❌ Token error:', tokenData);
      return res.status(400).json({
        error: tokenData?.error_description || 'Token exchange failed',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    console.log('🔐 Access token received:', accessToken.slice(0, 10) + '...');

    const siteResult = await fetchSites(accessToken);
    if (!siteResult.success) {
      console.error('❌ Site fetch failed:', siteResult.reason);
      return res.status(400).json({
        error: 'Failed to fetch Webflow sites',
        details: siteResult.reason,
      });
    }

    const siteId = siteResult.sites[0]?._id || siteResult.sites[0]?.id;
    if (!siteId) {
      console.error('❌ No valid site ID found');
      return res.status(400).json({ error: 'No hosted site ID found' });
    }

    res.setHeader('Set-Cookie', cookie.serialize('webflow_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
      sameSite: 'Lax',
    }));

    console.log('✅ Token exchange complete. Site ID:', siteId);

    return res.status(200).json({
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteResult.sites,
      issued_at: Date.now(),
      expires_in: 3600,
    });
  } catch (err) {
    console.error('❌ Unexpected error during token exchange:', err);
    return res.status(500).json({
      error: 'Unexpected error during token exchange',
      message: err?.message || 'Unknown error',
      stack: err?.stack,
    });
  }
}