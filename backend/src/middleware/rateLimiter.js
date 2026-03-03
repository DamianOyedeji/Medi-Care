import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true
});

// Chat rate limiter (more lenient for conversation flow)
export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: {
    error: 'Too many messages',
    message: 'Please slow down. Take a moment to breathe.'
  }
});

// Crisis escalation rate limiter (prevent spam/abuse)
export const crisisRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.CRISIS_RATE_LIMIT_MAX) || 5,
  message: {
    error: 'Crisis escalation limit reached',
    message: 'If you need immediate help, please call emergency services directly.'
  },
  handler: (req, res) => {
    logger.error('Crisis rate limit exceeded', {
      ip: req.ip,
      userId: req.body.userId
    });
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'If you are in crisis, please contact emergency services immediately.',
      emergencyNumbers: {
        US: '988', // Suicide & Crisis Lifeline
        UK: '116 123', // Samaritans
        International: 'https://findahelpline.com'
      }
    });
  }
});

// Voice API rate limiter (prevent abuse of voice services)
export const voiceRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 voice requests per minute
  message: {
    error: 'Too many voice requests',
    message: 'Please wait before making another voice request.'
  }
});

// Location / Overpass rate limiter (protect external API from hammering)
export const locationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 location lookups per minute per user
  message: {
    error: 'Too many location requests',
    message: 'Please wait a moment before searching for nearby resources again.'
  }
});

export default rateLimiter;