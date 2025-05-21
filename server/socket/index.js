const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const metrics = require('../metrics');

module.exports = (io) => {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      console.log('Socket auth token:', token.substring(0, 20) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('Socket auth decoded token:', JSON.stringify(decoded));

      if (!decoded.user || !decoded.user.id) {
        console.error('Socket authentication failed: Invalid token payload', decoded);
        return next(new Error('Authentication error: Invalid token payload'));
      }

      // Store user info in socket object
      socket.user = decoded.user;

      // Also store in handshake for persistence
      socket.handshake.user = decoded.user;

      console.log('Socket authenticated:', {
        socketId: socket.id,
        userId: socket.user.id,
        isAnonymous: socket.user.isAnonymous
      });

      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a poll room
    socket.on('poll:join', async (pollId) => {
      socket.join(`poll:${pollId}`);
      console.log(`User ${socket.id} joined poll ${pollId}`);

      try {
        const poll = await Poll.getById(pollId);
        if (poll) {
          socket.emit('poll:data', poll);
        }
      } catch (error) {
        console.error('Error fetching poll data:', error);
      }
    });

    // Leave a poll room
    socket.on('poll:leave', (pollId) => {
      socket.leave(`poll:${pollId}`);
      console.log(`User ${socket.id} left poll ${pollId}`);
    });

    // Submit a vote
    socket.on('poll:vote', async ({ pollId, optionId, userId: payloadUserId }) => {
      // Get user from socket, handshake, or payload
      const socketUser = socket.user || socket.handshake.user;

      // Use userId from payload if available, otherwise from socket auth
      const userId = payloadUserId || socketUser?.id || socket.handshake.auth.userId;

      console.log(`Vote request received - Poll: ${pollId}, Option: ${optionId}, User: ${userId || 'unknown'}`);
      console.log('Socket state:', {
        hasSocketUser: !!socket.user,
        hasHandshakeUser: !!socket.handshake.user,
        hasPayloadUserId: !!payloadUserId,
        hasAuthUserId: !!socket.handshake.auth.userId,
        socketId: socket.id,
        authToken: !!socket.handshake.auth.token
      });

      if (!userId) {
        console.error('Vote failed: No user ID available');
        socket.emit('error', { message: 'User ID is required to vote' });
        return;
      }

      if (!pollId || !optionId) {
        console.error('Vote failed: Missing poll ID or option ID');
        socket.emit('error', { message: 'Poll ID and option ID are required' });
        return;
      }

      try {
        console.log(`Creating vote - Poll: ${pollId}, Option: ${optionId}, User: ${userId}`);

        if (!userId || userId.trim() === '') {
          throw new Error('User ID is empty or invalid');
        }

        // Log all parameters for debugging
        console.log('Vote parameters:', {
          pollId,
          optionId,
          userId,
          userIdType: typeof userId
        });

        await Vote.create(pollId, optionId, userId);

        // Track vote via WebSocket
        metrics.voteCounter.inc();

        // Get updated poll
        const updatedPoll = await Poll.getById(pollId);

        // Broadcast to all clients in the room
        io.to(`poll:${pollId}`).emit('poll:update', updatedPoll);

        console.log(`Vote processed successfully - Poll: ${pollId}, User: ${userId}`);
      } catch (error) {
        console.error('Error processing vote:', error);
        socket.emit('error', {
          message: 'Failed to process vote',
          details: error.message
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
