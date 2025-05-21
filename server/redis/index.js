const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('reconnecting', () => {
  console.log('Reconnecting to Redis');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

// Initialize Redis connection
connectRedis();

module.exports = {
  redisClient,
  connectRedis
};
