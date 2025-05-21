const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');

describe('Votes API', () => {
  let token;
  let userId;
  let pollId;
  let optionId;

  // Generate a token and create a poll before tests
  beforeAll(async () => {
    // Generate token
    userId = 'test-vote-user-id';
    const payload = {
      user: {
        id: userId,
        isAnonymous: true
      }
    };
    token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

    // Create a poll
    const pollData = {
      title: 'Voting Test Poll',
      description: 'This is a test poll for voting',
      options: ['Vote Option 1', 'Vote Option 2'],
      expiresAt: null
    };

    const response = await request(app)
      .post('/api/polls')
      .set('x-auth-token', token)
      .send(pollData);

    pollId = response.body.id;
    optionId = response.body.options[0].id;
  });

  test('POST /api/polls/:id/vote should register a vote', async () => {
    const response = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('x-auth-token', token)
      .send({ optionId })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('id', pollId);
    
    // Find the voted option
    const votedOption = response.body.options.find(option => option.id === optionId);
    expect(votedOption).toBeDefined();
    expect(parseInt(votedOption.votes)).toBeGreaterThan(0);
  });

  test('POST /api/polls/:id/vote should update an existing vote', async () => {
    // Get the second option ID
    const pollResponse = await request(app)
      .get(`/api/polls/${pollId}`)
      .expect(200);
    
    const secondOptionId = pollResponse.body.options[1].id;

    // Vote for the second option
    const response = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('x-auth-token', token)
      .send({ optionId: secondOptionId })
      .expect('Content-Type', /json/)
      .expect(200);

    // Find the voted option
    const votedOption = response.body.options.find(option => option.id === secondOptionId);
    expect(votedOption).toBeDefined();
    expect(parseInt(votedOption.votes)).toBeGreaterThan(0);
    
    // The first option should have one less vote
    const firstOption = response.body.options.find(option => option.id === optionId);
    expect(parseInt(firstOption.votes)).toBe(0);
  });

  test('POST /api/polls/:id/vote should fail with invalid option ID', async () => {
    await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('x-auth-token', token)
      .send({ optionId: 'invalid-option-id' })
      .expect(400);
  });

  test('POST /api/polls/:id/vote should fail with invalid poll ID', async () => {
    await request(app)
      .post('/api/polls/invalid-poll-id/vote')
      .set('x-auth-token', token)
      .send({ optionId })
      .expect(404);
  });
});
