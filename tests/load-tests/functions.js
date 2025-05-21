const { v4: uuidv4 } = require('uuid');

/**
 * Create a poll if none exists
 */
function createPollIfNeeded(userContext, events, done) {
  // If we already have a poll ID, skip creating a new one
  if (userContext.vars.pollId) {
    return done();
  }

  // Generate a unique poll title
  const pollTitle = `Load Test Poll ${uuidv4().substring(0, 8)}`;
  
  // Create a new poll
  userContext.vars.title = pollTitle;
  userContext.vars.options = ['Option A', 'Option B', 'Option C'];
  
  // Set expiration date to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  userContext.vars.expiresAt = expiresAt.toISOString();
  
  // Make the request to create a poll
  const requestParams = {
    url: '/api/polls',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': userContext.vars.token
    },
    body: JSON.stringify({
      title: userContext.vars.title,
      options: userContext.vars.options,
      expiresAt: userContext.vars.expiresAt
    })
  };
  
  events.emit('request', requestParams, function(error, response, body) {
    if (error) {
      console.error('Error creating poll:', error);
      return done(error);
    }
    
    if (response.statusCode !== 201) {
      console.error('Failed to create poll:', response.statusCode, body);
      return done(new Error(`Failed to create poll: ${response.statusCode}`));
    }
    
    try {
      const poll = JSON.parse(body);
      userContext.vars.pollId = poll.id;
      userContext.vars.optionId = poll.options[0].id;
      return done();
    } catch (e) {
      console.error('Error parsing poll response:', e);
      return done(e);
    }
  });
}

module.exports = {
  createPollIfNeeded
};
