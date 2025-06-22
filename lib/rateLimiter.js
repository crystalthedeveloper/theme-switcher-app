// lib/rateLimiter.js

import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute window
  uniqueTokenPerInterval: 100, // Max 100 unique IPs per minute
});

export default async function applyRateLimit(req, res, limit = 30) {
  const isTest = process.env.NODE_ENV !== 'production' || req.query.test === 'true';

  if (isTest) {
    console.log('🧪 Rate limiting skipped (test mode)');
    return;
  }

  try {
    const ip = getClientIp(req);
    await limiter.check(res, limit, ip);
  } catch {
    const maskedIp = getClientIp(req, true);
    console.warn(`🚫 Rate limit exceeded for ${maskedIp}`);
    res.status(429).json({
      error: 'Too many requests — please wait and try again.',
    });
    throw new Error('Rate limit exceeded');
  }
}

function getClientIp(req, mask = false) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  return mask && typeof ip === 'string' ? ip.replace(/\.\d+$/, '.*') : ip;
}