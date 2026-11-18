import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register)
 * Prevents brute-force credential stuffing and password guessing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    errors: []
  },
  skip: (req) => process.env.NODE_ENV === 'test' // Skip rate limiting during automated tests
});

/**
 * General API rate limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    errors: []
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});
