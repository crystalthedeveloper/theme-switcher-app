// lib/rateLimiter.js
import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // max 500 unique users per interval
});

export default async function applyRateLimit(req, res, limit = 50) {
  if (process.env.NODE_ENV === 'development' || req.query.test === 'true') {
    console.log('🧪 Skipping rate limit in test mode');
    return;
  }

  try {
    await limiter.check(res, limit, req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  } catch {
    res.status(429).json({
      error: 'Too many requests — please try again later.',
    });
    throw new Error('Rate limit exceeded');
  }
}