const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class Vote {
  // Create a new vote
  static async create(pollId, optionId, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user has already voted on this poll
      const existingVote = await client.query(
        'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
        [pollId, userId]
      );
      
      if (existingVote.rows.length > 0) {
        // Update existing vote
        await client.query(
          'UPDATE votes SET option_id = $1 WHERE poll_id = $2 AND user_id = $3',
          [optionId, pollId, userId]
        );
      } else {
        // Create new vote
        await client.query(
          'INSERT INTO votes (id, poll_id, option_id, user_id) VALUES ($1, $2, $3, $4)',
          [uuidv4(), pollId, optionId, userId]
        );
      }
      
      await client.query('COMMIT');
      
      return true;
    } catch (error) {
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
