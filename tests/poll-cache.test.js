const { redisClient } = require('../server/redis');
const Poll = require('../server/models/Poll');
const db = require('../server/db');

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

describe('Poll Model with Redis Cache', () => {
  // Skip tests if Redis is not available
  const itif = (condition) => condition ? it : it.skip;
  const isRedisAvailable = redisClient && redisClient.isReady;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Mock database responses
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT * FROM polls WHERE id')) {
        return {
          rows: [{
            id: 'test-poll-id',
            title: 'Test Poll',
            description: 'Test Description',
            created_by: 'test-user',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
            is_active: true
          }]
        };
      } else if (query.includes('SELECT po.id, po.text, COUNT(v.id) as votes')) {
        return {
          rows: [
            { id: 'option-1', text: 'Option 1', votes: '2' },
            { id: 'option-2', text: 'Option 2', votes: '3' }
          ]
        };
      } else if (query.includes('UPDATE polls SET is_active')) {
        return {
          rows: [{
            id: 'test-poll-id',
            is_active: false
          }]
        };
      }
      return { rows: [] };
    });
  });

  beforeAll(async () => {
    if (isRedisAvailable) {
      // Clear test keys before tests
      await redisClient.del('poll:test-poll-id');
    }
  });

  afterAll(async () => {
    if (isRedisAvailable) {
      // Clean up after tests
      await redisClient.del('poll:test-poll-id');
      
      // Close Redis connection
      await redisClient.quit();
    }
  });

  itif(isRedisAvailable)('should cache poll data in Redis after fetching from database', async () => {
    // First call should fetch from database and cache
    const poll = await Poll.getById('test-poll-id');
    
    // Verify database was queried
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM polls WHERE id'),
      ['test-poll-id']
    );
    
    // Verify poll data is correct
    expect(poll).toHaveProperty('id', 'test-poll-id');
    expect(poll).toHaveProperty('title', 'Test Poll');
    expect(poll).toHaveProperty('options');
    expect(poll.options).toHaveLength(2);
    expect(poll).toHaveProperty('total_votes', 5);
    
    // Verify data was cached in Redis
    const cachedPoll = await redisClient.get('poll:test-poll-id');
    expect(cachedPoll).toBeTruthy();
    expect(JSON.parse(cachedPoll)).toEqual(poll);
    
    // Reset mock to verify second call
    jest.clearAllMocks();
    
    // Second call should use cache
    const cachedResult = await Poll.getById('test-poll-id');
    
    // Verify database was NOT queried
    expect(db.query).not.toHaveBeenCalled();
    
    // Verify cached result matches original
    expect(cachedResult).toEqual(poll);
  });

  itif(isRedisAvailable)('should invalidate cache when poll is updated', async () => {
    // First fetch to ensure poll is cached
    await Poll.getById('test-poll-id');
    
    // Verify data was cached in Redis
    let cachedPoll = await redisClient.get('poll:test-poll-id');
    expect(cachedPoll).toBeTruthy();
    
    // Update poll status
    await Poll.updateStatus('test-poll-id', false);
    
    // Verify cache was invalidated
    cachedPoll = await redisClient.get('poll:test-poll-id');
    expect(cachedPoll).toBeNull();
  });

  itif(isRedisAvailable)('should check for expired polls and update status', async () => {
    // Mock an expired poll
    db.query.mockImplementationOnce((query, params) => {
      if (query.includes('SELECT * FROM polls WHERE id')) {
        return {
          rows: [{
            id: 'expired-poll-id',
            title: 'Expired Poll',
            description: 'Expired Description',
            created_by: 'test-user',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            is_active: true
          }]
        };
      }
      return { rows: [] };
    });
    
    // Fetch the expired poll
    const poll = await Poll.getById('expired-poll-id');
    
    // Verify poll status was updated
    expect(poll.is_active).toBe(false);
    
    // Verify updateStatus was called
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE polls SET is_active'),
      [false, 'expired-poll-id']
    );
  });
});
