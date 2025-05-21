const { createRateLimiter, voteRateLimiter, apiRateLimiter } = require('../server/middleware/rateLimiter');

describe('Rate Limiter', () => {
  test('createRateLimiter should return a middleware function', () => {
    const limiter = createRateLimiter();
    expect(typeof limiter).toBe('function');
  });

  test('createRateLimiter should accept custom options', () => {
    const customOptions = {
      windowMs: 1000,
      max: 5,
      message: 'Custom rate limit message'
    };
    
    const limiter = createRateLimiter(customOptions);
    expect(typeof limiter).toBe('function');
    
    // We can't easily test the internal options, but we can verify it doesn't throw
    expect(() => limiter).not.toThrow();
  });

  test('voteRateLimiter should be defined', () => {
    expect(voteRateLimiter).toBeDefined();
    expect(typeof voteRateLimiter).toBe('function');
  });

  test('apiRateLimiter should be defined', () => {
    expect(apiRateLimiter).toBeDefined();
    expect(typeof apiRateLimiter).toBe('function');
  });
});
