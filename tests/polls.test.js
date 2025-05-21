const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');

describe('Polls API', () => {
  let token;
  let userId;

  // Generate a token before tests
  beforeAll(() => {
    userId = 'test-user-id';
    const payload = {
      user: {
        id: userId,
        isAnonymous: true
      }
    };
    token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  });

  test('POST /api/polls should create a new poll', async () => {
    const pollData = {
      title: 'Test Poll',
      description: 'This is a test poll',
      options: ['Option 1', 'Option 2', 'Option 3'],
      expiresAt: null
    };

    const response = await request(app)
      .post('/api/polls')
      .set('x-auth-token', token)
      .send(pollData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(pollData.title);
    expect(response.body.description).toBe(pollData.description);
    expect(response.body.options).toHaveLength(pollData.options.length);
  });

  test('GET /api/polls should return a list of polls', async () => {
    const response = await request(app)
      .get('/api/polls')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  // This test depends on the previous test creating a poll
  test('GET /api/polls/:id should return a specific poll', async () => {
    // First create a poll to get its ID
    const pollData = {
      title: 'Another Test Poll',
      description: 'This is another test poll',
      options: ['Option A', 'Option B'],
      expiresAt: null
    };

    const createResponse = await request(app)
      .post('/api/polls')
      .set('x-auth-token', token)
      .send(pollData);

    const pollId = createResponse.body.id;

    // Now test getting that poll
    const response = await request(app)
      .get(`/api/polls/${pollId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('id', pollId);
    expect(response.body.title).toBe(pollData.title);
    expect(response.body.options).toHaveLength(pollData.options.length);
  });
});
