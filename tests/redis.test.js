const { redisClient } = require('../server/redis');

describe('Redis Client', () => {
  // Skip tests if Redis is not available
  const itif = (condition) => condition ? it : it.skip;
  const isRedisAvailable = redisClient && redisClient.isReady;

  beforeAll(async () => {
    if (isRedisAvailable) {
      // Clear test keys before tests
      await redisClient.del('test:key');
    }
  });

  afterAll(async () => {
    if (isRedisAvailable) {
      // Clean up after tests
      await redisClient.del('test:key');
      
      // Close Redis connection
      await redisClient.quit();
    }
  });

  itif(isRedisAvailable)('should set and get a value', async () => {
    await redisClient.set('test:key', 'test-value');
    const value = await redisClient.get('test:key');
    expect(value).toBe('test-value');
  });

  itif(isRedisAvailable)('should increment a counter', async () => {
    await redisClient.set('test:counter', '0');
    
    const result1 = await redisClient.incr('test:counter');
    expect(result1).toBe(1);
    
    const result2 = await redisClient.incr('test:counter');
    expect(result2).toBe(2);
    
    const value = await redisClient.get('test:counter');
    expect(value).toBe('2');
  });

  itif(isRedisAvailable)('should set a key with expiration', async () => {
    await redisClient.set('test:expiring', 'will-expire', {
      EX: 1 // 1 second expiration
    });
    
    // Key should exist initially
    let exists = await redisClient.exists('test:expiring');
    expect(exists).toBe(1);
    
    // Wait for key to expire
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Key should no longer exist
    exists = await redisClient.exists('test:expiring');
    expect(exists).toBe(0);
  });

  it('should have a Redis client', () => {
    expect(redisClient).toBeDefined();
  });
});
