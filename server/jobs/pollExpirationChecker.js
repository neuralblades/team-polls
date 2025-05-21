const db = require('../db');
const { redisClient } = require('../redis');

/**
 * Check for expired polls and update their status
 */
const checkExpiredPolls = async () => {
  console.log('Running expired polls check job');
  
  try {
    // Find polls that have expired but are still active
    const result = await db.query(
      `UPDATE polls 
       SET is_active = false 
       WHERE expires_at < NOW() 
       AND is_active = true 
       RETURNING id`,
      []
    );
    
    const expiredPolls = result.rows;
    
    if (expiredPolls.length > 0) {
      console.log(`Found ${expiredPolls.length} expired polls, updating status to inactive`);
      
      // Invalidate cache for each expired poll
      if (redisClient.isReady) {
        for (const poll of expiredPolls) {
          await redisClient.del(`poll:${poll.id}`);
          console.log(`Invalidated cache for expired poll ${poll.id}`);
        }
      }
    } else {
      console.log('No expired polls found');
    }
  } catch (error) {
    console.error('Error checking for expired polls:', error);
  }
};

/**
 * Start the poll expiration checker job
 * @param {number} intervalMs - Interval in milliseconds (default: 1 minute)
 */
const startPollExpirationChecker = (intervalMs = 60000) => {
  console.log(`Starting poll expiration checker job with interval ${intervalMs}ms`);
  
  // Run immediately on startup
  checkExpiredPolls();
  
  // Then run at the specified interval
  return setInterval(checkExpiredPolls, intervalMs);
};

module.exports = {
  checkExpiredPolls,
  startPollExpirationChecker
};
