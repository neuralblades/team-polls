require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const path = require('path');
const db = require('./db');
const { connectRedis } = require('./redis');
const setupRedisAdapter = require('./socket/adapter');
const metrics = require('./metrics');

// Import routes
const pollRoutes = require('./routes/polls');
const authRoutes = require('./routes/auth');

// Import middleware
const { apiRateLimiter } = require('./middleware/rateLimiter');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// Set up Redis adapter for Socket.IO
setupRedisAdapter(io)
  .then(() => console.log('Redis adapter setup complete'))
  .catch(err => console.error('Redis adapter setup failed:', err));

// Initialize socket handlers
require('./socket')(io);

// Track WebSocket connections
io.on('connection', (socket) => {
  metrics.websocketConnectionsGauge.inc();

  socket.on('disconnect', () => {
    metrics.websocketConnectionsGauge.dec();
  });
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(metrics.metricsMiddleware);
app.use(apiRateLimiter);

// Health check route
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();
    res.json({
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Routes
app.use('/api/polls', pollRoutes);
app.use('/api/auth', authRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});

module.exports = { app, server, io };
