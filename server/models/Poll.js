const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { redisClient } = require('../redis');

class Poll {
  // Create a new poll
  static async create(title, description, options, createdBy, expiresAt) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const pollId = uuidv4();

      // Insert poll
      await client.query(
        'INSERT INTO polls (id, title, description, created_by, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [pollId, title, description, createdBy, expiresAt]
      );

      // Insert options
      for (const option of options) {
        await client.query(
          'INSERT INTO poll_options (id, poll_id, text) VALUES ($1, $2, $3)',
          [uuidv4(), pollId, option]
        );
      }

      await client.query('COMMIT');

      return this.getById(pollId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get poll by ID with options and vote counts
  static async getById(id) {
    // Try to get from cache first
    try {
      if (redisClient.isReady) {
        const cachedPoll = await redisClient.get(`poll:${id}`);
        if (cachedPoll) {
          console.log(`Cache hit for poll ${id}`);
          return JSON.parse(cachedPoll);
        }
      }
    } catch (error) {
      console.error('Redis cache error:', error);
      // Continue with database query if cache fails
    }

    console.log(`Cache miss for poll ${id}, fetching from database`);

    const pollResult = await db.query(
      'SELECT * FROM polls WHERE id = $1',
      [id]
    );

    if (pollResult.rows.length === 0) {
      return null;
    }

    const poll = pollResult.rows[0];

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      // If poll has expired but is still marked as active, update it
      if (poll.is_active) {
        console.log(`Poll ${id} has expired, updating status to inactive`);
        await this.updateStatus(id, false);
        poll.is_active = false;
      }
    }

    // Get options with vote counts
    const optionsResult = await db.query(
      `SELECT po.id, po.text, COUNT(v.id) as votes
       FROM poll_options po
       LEFT JOIN votes v ON po.id = v.option_id
       WHERE po.poll_id = $1
       GROUP BY po.id, po.text
       ORDER BY po.created_at`,
      [id]
    );

    poll.options = optionsResult.rows;
    poll.total_votes = poll.options.reduce((sum, option) => sum + parseInt(option.votes), 0);

    // Cache the poll data
    try {
      if (redisClient.isReady) {
        // Cache for 1 minute (60 seconds)
        // Use a shorter TTL for active polls to ensure fresh data
        const cacheTTL = poll.is_active ? 60 : 300; // 1 minute for active, 5 minutes for inactive
        await redisClient.set(`poll:${id}`, JSON.stringify(poll), {
          EX: cacheTTL
        });
        console.log(`Cached poll ${id} for ${cacheTTL} seconds`);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
      // Continue even if caching fails
    }

    return poll;
  }

  // Get all polls
  static async getAll(limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT p.*, COUNT(DISTINCT v.id) as total_votes
       FROM polls p
       LEFT JOIN votes v ON p.id = v.poll_id
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }

  // Update poll status
  static async updateStatus(id, isActive) {
    const result = await db.query(
      'UPDATE polls SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    return result.rows[0];
  }
}

module.exports = Poll;
