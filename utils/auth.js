// utils/auth.js

import cookie from 'cookie';

const COOKIE_NAME = 'webflow_token';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

// Retrieve token from request cookies (for API routes)
export function getTokenFromCookies(req) {
  if (!req?.headers?.cookie) return null;

  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}

// Set token cookie securely (e.g. in /callback after exchange)
export function setTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';

  const serialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  res.setHeader('Set-Cookie', serialized);
}

// Optional: clear the cookie
export function clearTokenCookie(res) {
  const serialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', serialized);
}