const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('../redis');

/**
 * Create a Redis adapter for Socket.IO
 * This allows for horizontal scaling with multiple Socket.IO servers
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
const setupRedisAdapter = async (io) => {
  try {
    console.log('Setting up Socket.IO Redis adapter...');

    // Create a duplicate Redis client for the pub/sub mechanism
    const pubClient = redisClient.duplicate();

    // Set up error handling for pub client
    pubClient.on('error', (err) => {
      console.error('Redis pub client error:', err);
    });

    console.log('Connecting Redis pub client...');
    await pubClient.connect();
    console.log('Redis pub client connected');

    const subClient = pubClient.duplicate();

    // Set up error handling for sub client
    subClient.on('error', (err) => {
      console.error('Redis sub client error:', err);
    });

    console.log('Connecting Redis sub client...');
    await subClient.connect();
    console.log('Redis sub client connected');

    // Create and set the Redis adapter
    io.adapter(createAdapter(pubClient, subClient));

    console.log('Socket.IO Redis adapter configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up Socket.IO Redis adapter:', error);
    console.warn('Falling back to in-memory adapter');
    return false;
  }
};

module.exports = setupRedisAdapter;
