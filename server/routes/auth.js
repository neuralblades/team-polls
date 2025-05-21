const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/auth/anon
// @desc    Generate anonymous JWT token
// @access  Public
router.post('/anon', (req, res) => {
  try {
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
        if (err) throw err;
        res.json({ token, userId });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
