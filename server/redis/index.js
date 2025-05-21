const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with a maximum delay of 10 seconds
      const delay = Math.min(Math.pow(2, retries) * 100, 10000);
      console.log(`Redis reconnect attempt ${retries}, next attempt in ${delay}ms`);
      return delay;
    }
  }
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

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    console.log('Connecting to Redis...');
    await redisClient.connect();
    console.log('Redis connection established');
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return false;
  }
};

// Initialize Redis connection
connectRedis();

module.exports = {
  redisClient,
  connectRedis
};
