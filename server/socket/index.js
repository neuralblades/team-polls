const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

module.exports = (io) => {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
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
    socket.on('poll:vote', async ({ pollId, optionId }) => {
      try {
        // Create vote
        await Vote.create(pollId, optionId, socket.user.id);
        
        // Get updated poll
        const updatedPoll = await Poll.getById(pollId);
        
        // Broadcast to all clients in the room
        io.to(`poll:${pollId}`).emit('poll:update', updatedPoll);
      } catch (error) {
        console.error('Error processing vote:', error);
        socket.emit('error', { message: 'Failed to process vote' });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
