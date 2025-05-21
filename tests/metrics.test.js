const request = require('supertest');
const { app } = require('../server');
const metrics = require('../server/metrics');

describe('Metrics', () => {
  test('GET /metrics should return Prometheus metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    // Response should contain Prometheus metrics
    expect(response.text).toContain('# HELP');
    expect(response.text).toContain('# TYPE');
  });

  test('metrics module should expose a registry', () => {
    expect(metrics.register).toBeDefined();
  });

  test('metrics module should expose HTTP request duration metric', () => {
    expect(metrics.httpRequestDurationMicroseconds).toBeDefined();
    expect(metrics.httpRequestDurationMicroseconds.name).toBe('http_request_duration_seconds');
  });

  test('metrics module should expose HTTP request counter', () => {
    expect(metrics.httpRequestCounter).toBeDefined();
    expect(metrics.httpRequestCounter.name).toBe('http_requests_total');
  });

  test('metrics module should expose WebSocket connections gauge', () => {
    expect(metrics.websocketConnectionsGauge).toBeDefined();
    expect(metrics.websocketConnectionsGauge.name).toBe('websocket_connections');
  });

  test('metrics module should expose poll creation counter', () => {
    expect(metrics.pollCreationCounter).toBeDefined();
    expect(metrics.pollCreationCounter.name).toBe('polls_created_total');
  });

  test('metrics module should expose vote counter', () => {
    expect(metrics.voteCounter).toBeDefined();
    expect(metrics.voteCounter.name).toBe('votes_cast_total');
  });

  test('metrics module should expose rate limit exceeded counter', () => {
    expect(metrics.rateLimitExceededCounter).toBeDefined();
    expect(metrics.rateLimitExceededCounter.name).toBe('rate_limit_exceeded_total');
  });

  test('metrics middleware should be a function', () => {
    expect(typeof metrics.metricsMiddleware).toBe('function');
  });
});
