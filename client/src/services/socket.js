import { io } from 'socket.io-client';

// Socket.io instance
let socket;

// Initialize socket connection
export const initSocket = (token) => {
  // Use the same URL for both production and development
  // This ensures we connect to the load balancer in both environments
  const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:5001';

  console.log('Initializing socket with token:', token ? 'Token exists' : 'No token');

  // Close existing connection if any
  if (socket) {
    socket.disconnect();
  }

  // Create new connection
  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    withCredentials: true,
    transports: ['websocket', 'polling']
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
export const submitVote = (pollId, optionId, userId) => {
  if (!socket) return;
  console.log(`Submitting vote via socket - Poll: ${pollId}, Option: ${optionId}, User: ${userId || 'unknown'}`);
  socket.emit('poll:vote', { pollId, optionId, userId });
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
