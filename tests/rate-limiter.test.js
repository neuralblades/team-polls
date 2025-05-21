const { createRateLimiter } = require('../server/middleware/rateLimiter');
const { redisClient } = require('../server/redis');
const express = require('express');
const request = require('supertest');

describe('Rate Limiter Middleware', () => {
  // Skip tests if Redis is not available
  const itif = (condition) => condition ? it : it.skip;
  const isRedisAvailable = redisClient && redisClient.isReady;
  
  let app;
  
  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    
    // Add a test endpoint
    app.get('/test', (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
  });
  
  beforeAll(async () => {
    if (isRedisAvailable) {
      // Clear test keys before tests
      const keys = await redisClient.keys('rl:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  });
  
  afterAll(async () => {
    if (isRedisAvailable) {
      // Clean up after tests
      const keys = await redisClient.keys('rl:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      // Close Redis connection
      await redisClient.quit();
    }
  });
  
  it('should allow requests under the rate limit', async () => {
    // Create a rate limiter with a high limit
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 10 // 10 requests per second
    });
    
    // Apply the rate limiter to the test endpoint
    app.use('/test', rateLimiter);
    
    // Make 5 requests (below the limit)
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }
  });
  
  it('should block requests over the rate limit', async () => {
    // Create a rate limiter with a low limit
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 3 // 3 requests per second
    });
    
    // Apply the rate limiter to the test endpoint
    app.use('/test', rateLimiter);
    
    // Make 3 requests (at the limit)
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }
    
    // Make 1 more request (over the limit)
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty('message');
  });
  
  itif(isRedisAvailable)('should use Redis store when available', async () => {
    // Create a rate limiter with Redis store
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 2 // 2 requests per second
    });
    
    // Apply the rate limiter to the test endpoint
    app.use('/test', rateLimiter);
    
    // Make 2 requests (at the limit)
    for (let i = 0; i < 2; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }
    
    // Make 1 more request (over the limit)
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
    
    // Check if Redis has stored the rate limit info
    const keys = await redisClient.keys('rl:*');
    expect(keys.length).toBeGreaterThan(0);
  });
  
  it('should use custom key generator', async () => {
    // Create a rate limiter with custom key generator
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 1, // 1 request per second
      keyGenerator: () => 'test-user-id' // Always use the same key
    });
    
    // Apply the rate limiter to the test endpoint
    app.use('/test', rateLimiter);
    
    // Make 1 request (at the limit)
    const response1 = await request(app).get('/test');
    expect(response1.status).toBe(200);
    
    // Make 1 more request (over the limit)
    const response2 = await request(app).get('/test');
    expect(response2.status).toBe(429);
  });
});
