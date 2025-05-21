const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/auth/anon
// @desc    Generate anonymous JWT token
// @access  Public
router.post('/anon', (req, res) => {
  try {
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).send('Server configuration error');
    }

    // Generate a random user ID for anonymous users
    const userId = uuidv4();
    
    // Create JWT payload
    const payload = {
      user: {
        id: userId,
        isAnonymous: true
      }
    };
    
    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err.message);
          return res.status(500).send('Error generating authentication token');
        }
        res.json({ token, userId });
      }
    );
  } catch (err) {
    console.error('Anonymous auth error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;