const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { redisClient } = require('../redis');

class Vote {
  // Create a new vote
  static async create(pollId, optionId, userId) {
    console.log(`Vote.create called with pollId=${pollId}, optionId=${optionId}, userId=${userId || 'undefined'}`);

    if (!userId) {
      console.error('Vote.create: userId is null or undefined');
      throw new Error('User ID is required to create a vote');
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user has already voted on this poll
      console.log(`Checking for existing vote - Poll: ${pollId}, User: ${userId}`);
      const existingVote = await client.query(
        'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
        [pollId, userId]
      );

      console.log(`Existing vote check result: ${existingVote.rows.length} rows found`);

      if (existingVote.rows.length > 0) {
        // Update existing vote
        console.log(`Updating existing vote - Poll: ${pollId}, User: ${userId}, Option: ${optionId}`);
        await client.query(
          'UPDATE votes SET option_id = $1 WHERE poll_id = $2 AND user_id = $3',
          [optionId, pollId, userId]
        );
      } else {
        // Create new vote
        const voteId = uuidv4();
        console.log(`Creating new vote - ID: ${voteId}, Poll: ${pollId}, User: ${userId}, Option: ${optionId}`);
        await client.query(
          'INSERT INTO votes (id, poll_id, option_id, user_id) VALUES ($1, $2, $3, $4)',
          [voteId, pollId, optionId, userId]
        );
      }

      await client.query('COMMIT');
      console.log(`Vote transaction committed successfully - Poll: ${pollId}, User: ${userId}`);

      // Invalidate poll cache
      try {
        if (redisClient.isReady) {
          await redisClient.del(`poll:${pollId}`);
          console.log(`Invalidated cache for poll ${pollId}`);
        }
      } catch (error) {
        console.error('Redis cache invalidation error:', error);
        // Continue even if cache invalidation fails
      }

      return true;
    } catch (error) {
      console.error(`Vote transaction failed - Poll: ${pollId}, User: ${userId}`, error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get votes for a poll
  static async getByPollId(pollId) {
    const result = await db.query(
      `SELECT v.*, po.text as option_text
       FROM votes v
       JOIN poll_options po ON v.option_id = po.id
       WHERE v.poll_id = $1
       ORDER BY v.created_at DESC`,
      [pollId]
    );

    return result.rows;
  }

  // Get vote counts by option for a poll
  static async getCountsByPollId(pollId) {
    const result = await db.query(
      `SELECT po.id, po.text, COUNT(v.id) as count
       FROM poll_options po
       LEFT JOIN votes v ON po.id = v.option_id
       WHERE po.poll_id = $1
       GROUP BY po.id, po.text
       ORDER BY po.created_at`,
      [pollId]
    );

    return result.rows;
  }
}

module.exports = Vote;
