// pages/api/exchange-token.js

import * as cookie from 'cookie';
import { fetchWebflowSites } from '../../lib/webflow';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Missing authorization code' });
  }

  const {
    WEBFLOW_CLIENT_ID: clientId,
    WEBFLOW_CLIENT_SECRET: clientSecret,
    WEBFLOW_REDIRECT_URI: redirectUri,
  } = process.env;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
      success: false,
      error: 'Missing required environment variables',
      details: {
        WEBFLOW_CLIENT_ID: !!clientId,
        WEBFLOW_CLIENT_SECRET: !!clientSecret,
        WEBFLOW_REDIRECT_URI: !!redirectUri,
      },
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

    const rawText = await tokenRes.text();
    console.log('🔁 Webflow raw token response:', rawText);

    let tokenData;
    try {
      tokenData = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ Failed to parse token response JSON:', parseError.message);
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response from Webflow token endpoint',
        raw: rawText,
      });
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).json({
        success: false,
        error: tokenData?.error_description || 'Token exchange failed',
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    const siteResult = await fetchWebflowSites(accessToken);

    if (!siteResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch Webflow sites',
        details: siteResult.reason,
      });
    }

    const siteId = siteResult.sites[0]?.id;
    if (!siteId) {
      return res.status(400).json({ success: false, error: 'No hosted site ID found' });
    }

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('webflow_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600,
        path: '/',
        sameSite: 'Lax',
      })
    );


    return res.status(200).json({
      success: true,
      access_token: accessToken,
      token_type: tokenData.token_type || 'Bearer',
      site_id: siteId,
      sites: siteResult.sites,
      issued_at: Date.now(),
      expires_in: 3600,
    });
  } catch (err) {
    console.error('❌ Unexpected server error during token exchange:', err);
    return res.status(500).json({
      success: false,
      error: 'Unexpected error during token exchange',
      message: err.message,
      stack: err.stack,
    });
  }
}