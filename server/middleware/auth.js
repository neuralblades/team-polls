const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded.user;

    // Log authentication info for debugging
    console.log('Auth middleware - User authenticated:', {
      userId: req.user.id,
      isAnonymous: req.user.isAnonymous
    });

    next();
  } catch (err) {
    console.error('Auth middleware - Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
