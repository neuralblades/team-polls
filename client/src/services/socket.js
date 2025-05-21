import { io } from 'socket.io-client';

// Socket.io instance
let socket;

// Initialize socket connection
export const initSocket = (token) => {
  // Get the API URL from environment or use default
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  console.log('Initializing socket with URL:', API_URL);
  console.log('Token available:', !!token);

  // Close existing connection if any
  if (socket) {
    console.log('Disconnecting existing socket connection');
    socket.disconnect();
  }

  try {
    // Create new connection
    socket = io(API_URL, {
      auth: {
        token
      },
      withCredentials: true,
      transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected successfully with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      console.error('Socket connection error details:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
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
