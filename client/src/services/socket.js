import { io } from 'socket.io-client';

// Socket.io instance
let socket;

// Initialize socket connection
export const initSocket = (token) => {
  const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:5000';
  
  // Close existing connection if any
  if (socket) {
    socket.disconnect();
  }
  
  // Create new connection
  socket = io(SOCKET_URL, {
    auth: {
      token
    }
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
  
  return socket;
};

// Join a poll room
export const joinPoll = (pollId) => {
  if (!socket) return;
  socket.emit('poll:join', pollId);
};

// Leave a poll room
export const leavePoll = (pollId) => {
  if (!socket) return;
  socket.emit('poll:leave', pollId);
};

// Submit a vote
export const submitVote = (pollId, optionId) => {
  if (!socket) return;
  socket.emit('poll:vote', { pollId, optionId });
};

// Get socket instance
export const getSocket = () => socket;

export default {
  initSocket,
  joinPoll,
  leavePoll,
  submitVote,
  getSocket
};
