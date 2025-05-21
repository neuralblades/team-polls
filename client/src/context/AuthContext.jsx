import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(true);

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing authentication...');
      console.log('Current state:', { token, userId });

      // Check if token exists
      if (token && userId) {
        console.log('Using existing token and userId');
        // Set axios default headers
        axios.defaults.headers.common['x-auth-token'] = token;
      } else {
        // Get anonymous token
        try {
          console.log('Requesting new anonymous token...');
          const res = await axios.post('/api/auth/anon');
          const { token: newToken, userId: newUserId } = res.data;

          console.log('Received new token and userId:', {
            token: newToken ? 'Token exists' : 'No token',
            userId: newUserId || 'No userId'
          });

          if (!newToken || !newUserId) {
            console.error('Invalid response from auth server - missing token or userId');
            return;
          }

          // Save to localStorage
          localStorage.setItem('token', newToken);
          localStorage.setItem('userId', newUserId);

          // Update state
          setToken(newToken);
          setUserId(newUserId);

          // Set axios default headers
          axios.defaults.headers.common['x-auth-token'] = newToken;

          console.log('Authentication initialized successfully');
        } catch (error) {
          console.error('Error getting anonymous token:', error);
          console.error('Error details:', error.response?.data || 'No response data');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, userId]);

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
