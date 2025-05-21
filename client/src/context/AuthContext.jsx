import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(true);

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing authentication...');
      // Check if token exists
      if (token && userId) {
        console.log('Current state:', { token: token.substring(0, 20) + '...', userId });
        // Set axios default headers
        axios.defaults.headers.common['x-auth-token'] = token;
      } else {
        // Get anonymous token
        console.log('Requesting new anonymous token...');
        try {
          const { token: newToken, userId: newUserId } = await authApi.getAnonToken();

          console.log('Received new token:', {
            token: newToken.substring(0, 20) + '...',
            userId: newUserId
          });

          // Save to localStorage
          localStorage.setItem('token', newToken);
          localStorage.setItem('userId', newUserId);

          // Update state
          setToken(newToken);
          setUserId(newUserId);

          // Set axios default headers
          axios.defaults.headers.common['x-auth-token'] = newToken;
        } catch (error) {
          console.error('Error getting anonymous token:', error);
          console.error('Error details:', error.response?.data || 'No response data');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');

    // Remove from state
    setToken(null);
    setUserId(null);

    // Remove from axios headers
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        loading,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
