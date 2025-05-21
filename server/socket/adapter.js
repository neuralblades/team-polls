const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('../redis');

/**
 * Create a Redis adapter for Socket.IO
 * This allows for horizontal scaling with multiple Socket.IO servers
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
const setupRedisAdapter = async (io) => {
  try {
    // Create a duplicate Redis client for the pub/sub mechanism
    const pubClient = redisClient.duplicate();
    await pubClient.connect();
    
    const subClient = pubClient.duplicate();
    await subClient.connect();
    
    // Create and set the Redis adapter
    io.adapter(createAdapter(pubClient, subClient));
    
    console.log('Socket.IO Redis adapter configured successfully');
  } catch (error) {
    console.error('Failed to set up Socket.IO Redis adapter:', error);
    console.warn('Falling back to in-memory adapter');
  }
};

module.exports = setupRedisAdapter;
