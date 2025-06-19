// lib/rateLimiter.js
import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // Up to 100 unique IPs per minute
});

export default async function applyRateLimit(req, res, limit = 30) {
  const isTest = process.env.NODE_ENV === 'development' || req.query.test === 'true';

  if (isTest) {
    console.log('🧪 Skipping rate limit in test mode for:', maskIp(req));
    return;
  }

  try {
    await limiter.check(
      res,
      limit,
      req.headers['x-forwarded-for'] || req.socket.remoteAddress
    );
  } catch {
    const ip = maskIp(req);
    console.warn(`🚫 Rate limit exceeded for ${ip}`);
    res.status(429).json({
      error: 'Too many requests — please wait a moment and try again.',
    });
    throw new Error('Rate limit exceeded');
  }
}

function maskIp(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  return typeof ip === 'string' ? ip.replace(/\.\d+$/, '.*') : 'unknown';
}