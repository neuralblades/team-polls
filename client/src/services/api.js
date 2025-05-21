import axios from 'axios';

// Set base URL for API requests
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions
export const pollsApi = {
  // Get all polls
  getPolls: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get(`/polls?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get poll by ID
  getPoll: async (id) => {
    try {
      const response = await api.get(`/polls/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new poll
  createPoll: async (pollData) => {
    try {
      const response = await api.post('/polls', pollData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vote on a poll
  votePoll: async (pollId, optionId) => {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, { optionId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const authApi = {
  // Get anonymous token
  getAnonToken: async () => {
    try {
      const response = await api.post('/auth/anon');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
