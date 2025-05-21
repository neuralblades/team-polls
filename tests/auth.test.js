const request = require('supertest');
const { app } = require('../server');

describe('Auth API', () => {
  test('POST /api/auth/anon should return a token and userId', async () => {
    const response = await request(app)
      .post('/api/auth/anon')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('userId');
    expect(typeof response.body.token).toBe('string');
    expect(typeof response.body.userId).toBe('string');
  });
});
