const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP request duration metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// WebSocket connections gauge
const websocketConnectionsGauge = new promClient.Gauge({
  name: 'websocket_connections',
  help: 'Current number of WebSocket connections'
});

// Poll creation counter
const pollCreationCounter = new promClient.Counter({
  name: 'polls_created_total',
  help: 'Total number of polls created'
});

// Vote counter
const voteCounter = new promClient.Counter({
  name: 'votes_cast_total',
  help: 'Total number of votes cast'
});

// Rate limit exceeded counter
const rateLimitExceededCounter = new promClient.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded events',
  labelNames: ['path']
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(websocketConnectionsGauge);
register.registerMetric(pollCreationCounter);
register.registerMetric(voteCounter);
register.registerMetric(rateLimitExceededCounter);

// Middleware to track HTTP request duration and count
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Record end time and calculate duration on response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    
    // Extract route pattern from Express
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestCounter
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  websocketConnectionsGauge,
  pollCreationCounter,
  voteCounter,
  rateLimitExceededCounter
};
