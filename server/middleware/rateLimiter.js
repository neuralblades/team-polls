const rateLimit = require('express-rate-limit');
const { RateLimiterRedis } = require('rate-limit-redis');
const { redisClient } = require('../redis');
const metrics = require('../metrics');

// Create rate limiter middleware
const createRateLimiter = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute by default
    max = parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per windowMs by default
    standardHeaders = true,
    legacyHeaders = false,
    message = {
      status: 429,
      message: 'Too many requests, please try again later.'
    },
    keyGenerator = (req) => {
      // Use user ID from JWT token if available, otherwise use IP
      return req.user?.id || req.ip;
    }
  } = options;

  // Create Redis store for rate limiter if Redis is available
  let store;
  try {
    if (redisClient.isReady) {
      store = new RateLimiterRedis({
        // @ts-expect-error - Known issue with types
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:'
      });
      console.log('Using Redis store for rate limiting');
    } else {
      console.warn('Redis not ready, using memory store for rate limiting');
    }
  } catch (error) {
    console.error('Error creating Redis store for rate limiting:', error);
    console.warn('Falling back to memory store for rate limiting');
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    message,
    keyGenerator,
    store,
    handler: (req, res, _next, options) => {
      // Track rate limit exceeded
      metrics.rateLimitExceededCounter.inc({ path: req.path });

      // Send the default response
      res.status(options.statusCode).json(options.message);
    }
  });
};

// Create vote rate limiter (5 votes per second per user)
const voteRateLimiter = createRateLimiter({
  windowMs: 1000, // 1 second
  max: 5, // 5 requests per second
  message: {
    status: 429,
    message: 'Too many vote requests, please try again later.'
  }
});

// Create general API rate limiter
const apiRateLimiter = createRateLimiter();

module.exports = {
  voteRateLimiter,
  apiRateLimiter,
  createRateLimiter,
  default: apiRateLimiter
};
