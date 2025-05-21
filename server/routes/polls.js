const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { voteRateLimiter } = require('../middleware/rateLimiter');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const metrics = require('../metrics');
const { sanitizeInput } = require('../utils/security'); // Assuming a sanitization utility

// @route   POST /api/polls
// @desc    Create a new poll
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, options, expiresAt } = req.body;
    
    // Validate input
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: 'Title and at least two options are required'
      });
    }
    
    // Validate expiresAt if provided
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        return res.status(400).json({
          message: 'Expiry date must be valid and in the future'
        });
      }
    }
    
    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDesc = description ? sanitizeInput(description) : '';
    const sanitizedOptions = options.map(option => sanitizeInput(option));
    
    const poll = await Poll.create(
      sanitizedTitle,
      sanitizedDesc,
      sanitizedOptions,
      req.user.id,
      expiresAt
    );
    
    // Track poll creation
    metrics.pollCreationCounter.inc();
    res.status(201).json(poll);
  } catch (err) {
    console.error('Error creating poll:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/polls/:id
// @desc    Get poll by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.getById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error(`Error fetching poll ${req.params.id}:`, err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/polls
// @desc    Get all polls
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Add upper bounds to prevent abuse
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 polls
    const offset = Math.max(parseInt(req.query.offset) || 0, 0); // Min 0 offset
    
    const polls = await Poll.getAll(limit, offset);
    res.json(polls);
  } catch (err) {
    console.error('Error fetching polls:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/polls/:id/vote
// @desc    Vote on a poll
// @access  Private
router.post('/:id/vote', auth, voteRateLimiter, async (req, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    const userId = req.user.id;
    
    if (!optionId) {
      return res.status(400).json({ message: 'Option ID is required' });
    }
    
    // Check if poll exists
    const poll = await Poll.getById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    // Check if poll is active
    if (!poll.is_active) {
      return res.status(400).json({ message: 'Poll is no longer active' });
    }
    
    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Poll has expired' });
    }
    
    // Check if option exists
    const optionExists = poll.options.some(option => option.id === optionId);
    if (!optionExists) {
      return res.status(400).json({ message: 'Invalid option ID' });
    }
    
    // Check if user has already voted
    const existingVote = await Vote.getByUserAndPoll(userId, pollId);
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }
    
    // Create vote and verify success
    const voteResult = await Vote.create(pollId, optionId, userId);
    if (!voteResult) {
      return res.status(500).json({ message: 'Failed to record your vote' });
    }
    
    // Track vote
    metrics.voteCounter.inc();
    
    // Get updated poll
    const updatedPoll = await Poll.getById(pollId);
    res.json(updatedPoll);
  } catch (err) {
    console.error(`Error voting on poll ${req.params.id}:`, err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;