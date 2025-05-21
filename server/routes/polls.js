const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { voteRateLimiter } = require('../middleware/rateLimiter');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const metrics = require('../metrics');

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

    const poll = await Poll.create(
      title,
      description,
      options,
      req.user.id,
      expiresAt
    );

    // Track poll creation
    metrics.pollCreationCounter.inc();

    res.status(201).json(poll);
  } catch (err) {
    console.error(err.message);
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/polls
// @desc    Get all polls
// @access  Public
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const polls = await Poll.getAll(limit, offset);

    res.json(polls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/polls/:id/vote
// @desc    Vote on a poll
// @access  Private
router.post('/:id/vote', auth, voteRateLimiter, async (req, res) => {
  try {
    const { optionId } = req.body;

    if (!optionId) {
      return res.status(400).json({ message: 'Option ID is required' });
    }

    // Check if poll exists
    const poll = await Poll.getById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (!poll.is_active) {
      return res.status(400).json({ message: 'Poll is no longer active' });
    }

    // Check if option exists
    const optionExists = poll.options.some(option => option.id === optionId);

    if (!optionExists) {
      return res.status(400).json({ message: 'Invalid option ID' });
    }

    // Create vote
    await Vote.create(req.params.id, optionId, req.user.id);

    // Track vote
    metrics.voteCounter.inc();

    // Get updated poll
    const updatedPoll = await Poll.getById(req.params.id);

    res.json(updatedPoll);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
