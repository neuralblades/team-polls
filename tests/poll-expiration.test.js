const { checkExpiredPolls } = require('../server/jobs/pollExpirationChecker');
const db = require('../server/db');
const { redisClient } = require('../server/redis');

// Mock the database module
jest.mock('../server/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn()
    })
  },
  testConnection: jest.fn().mockResolvedValue(true)
}));

describe('Poll Expiration Checker', () => {
  // Skip tests if Redis is not available
  const itif = (condition) => condition ? it : it.skip;
  const isRedisAvailable = redisClient && redisClient.isReady;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    if (isRedisAvailable) {
      // Clear test keys before tests
      await redisClient.del('poll:expired-poll-1');
      await redisClient.del('poll:expired-poll-2');
    }
  });

  afterAll(async () => {
    if (isRedisAvailable) {
      // Clean up after tests
      await redisClient.del('poll:expired-poll-1');
      await redisClient.del('poll:expired-poll-2');
      
      // Close Redis connection
      await redisClient.quit();
    }
  });

  it('should update expired polls and set them to inactive', async () => {
    // Mock database response for expired polls
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 'expired-poll-1' },
        { id: 'expired-poll-2' }
      ]
    });
    
    // Cache some test data in Redis
    if (isRedisAvailable) {
      await redisClient.set('poll:expired-poll-1', JSON.stringify({ id: 'expired-poll-1', is_active: true }));
      await redisClient.set('poll:expired-poll-2', JSON.stringify({ id: 'expired-poll-2', is_active: true }));
    }
    
    // Run the expiration checker
    await checkExpiredPolls();
    
    // Verify database was queried with the correct SQL
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE polls SET is_active = false WHERE expires_at < NOW() AND is_active = true'),
      []
    );
    
    // Verify Redis cache was invalidated if available
    if (isRedisAvailable) {
      const cachedPoll1 = await redisClient.get('poll:expired-poll-1');
      const cachedPoll2 = await redisClient.get('poll:expired-poll-2');
      
      expect(cachedPoll1).toBeNull();
      expect(cachedPoll2).toBeNull();
    }
  });

  it('should handle case when no expired polls are found', async () => {
    // Mock database response for no expired polls
    db.query.mockResolvedValueOnce({
      rows: []
    });
    
    // Run the expiration checker
    await checkExpiredPolls();
    
    // Verify database was queried
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE polls SET is_active = false WHERE expires_at < NOW() AND is_active = true'),
      []
    );
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    db.query.mockRejectedValueOnce(new Error('Database connection error'));
    
    // Run the expiration checker (should not throw)
    await expect(checkExpiredPolls()).resolves.not.toThrow();
  });
});
