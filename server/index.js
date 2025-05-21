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

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io with proper CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || process.env.CLIENT_URL
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || process.env.CLIENT_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Configure Helmet with OWASP recommended security headers
app.use(
  helmet({
    // Content-Security-Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_URL || ''], // Add CDN sources if needed
        styleSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_URL || ''],
        imgSrc: ["'self'", "data:", process.env.CLIENT_URL || ''],
        connectSrc: ["'self'", process.env.API_URL || '', process.env.CLIENT_URL || ''],
        fontSrc: ["'self'", "data:", process.env.CLIENT_URL || ''],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    // X-XSS-Protection
    xssFilter: true,
    // X-Content-Type-Options
    noSniff: true,
    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },
    // Strict-Transport-Security
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    },
    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    // Permissions-Policy (formerly Feature-Policy)
    permittedCrossDomainPolicies: {
      permittedPolicies: "none"
    }
  })
);

// Add Permissions-Policy header separately as Helmet doesn't fully support it yet
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  next();
});

// For HTTPS environments, add additional security
if (process.env.NODE_ENV === 'production') {
  // Force HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      // Trust the X-Forwarded-Proto header only from trusted proxies
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        next();
      } else {
        res.redirect(`https://${req.hostname}${req.url}`);
      }
    } else {
      next();
    }
  });
}

// Add security headers
app.use((req, res, next) => {
  // Clear Site Data (for logout routes, if applicable)
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  // Cross-Origin-Resource-Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  // Cross-Origin-Opener-Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Cross-Origin-Embedder-Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(metrics.metricsMiddleware);
app.use(apiRateLimiter);

// Health check route
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();

    // Test Redis connection
    let redisConnected = false;
    try {
      // Simple ping to check if Redis is connected
      const { redisClient } = require('./redis');
      if (redisClient.isReady) {
        await redisClient.ping();
        redisConnected = true;
      }
    } catch (redisError) {
      console.error('Redis health check failed:', redisError);
    }

    // Get instance ID for debugging
    const instanceId = process.env.HOSTNAME || 'unknown';

    res.json({
      status: dbConnected && redisConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
      instance: instanceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Metrics endpoint with proper authentication
if (process.env.NODE_ENV === 'production') {
  const metricsAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
      return res.status(401).send('Unauthorized');
    }
    next();
  };
  app.get('/metrics', metricsAuth, async (req, res) => {
    try {
      res.set('Content-Type', metrics.register.contentType);
      res.end(await metrics.register.metrics());
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).send('Error generating metrics');
    }
  });
} else {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', metrics.register.contentType);
      res.end(await metrics.register.metrics());
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).send('Error generating metrics');
    }
  });
}

// Routes
app.use('/api/polls', pollRoutes);
app.use('/api/auth', authRoutes);

// Add security headers for all responses
app.use((req, res, next) => {
  // Cache-Control header to prevent sensitive information caching
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Add cache headers for static assets
  app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: '1y',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  metrics.errorCounter.inc({ path: req.path }); // Track errors by path

  // Don't expose error details in production
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server function
async function startServer() {
  try {
    // Connect to database
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    console.log('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    console.log('Redis connected successfully');

    // Set up Redis adapter for Socket.IO
    const adapterSuccess = await setupRedisAdapter(io);
    if (adapterSuccess) {
      console.log('Redis adapter setup complete - Socket.IO will use Redis for scaling');
    } else {
      console.warn('Redis adapter setup failed - Socket.IO will use in-memory adapter (scaling limited)');
    }

    // Initialize socket handlers with authentication
    require('./socket')(io);

    // Track WebSocket connections
    io.on('connection', (socket) => {
      metrics.websocketConnectionsGauge.inc();

      // Implement socket authentication
      const token = socket.handshake.auth.token;
      if (!token) {
        console.warn('Socket connection attempt without authentication');
        socket.disconnect(true);
        return;
      }

      // Add listener for disconnect to properly decrement the counter
      socket.on('disconnect', () => {
        metrics.websocketConnectionsGauge.dec();
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`Metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database pool
    if (db.pool) {
      db.pool.end().then(() => {
        console.log('Database connections closed');
        process.exit(0);
      }).catch(err => {
        console.error('Error closing database connections:', err);
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  });
});

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  metrics.errorCounter.inc({ type: 'uncaughtException' });
  // Give the server a grace period to finish existing requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  metrics.errorCounter.inc({ type: 'unhandledRejection' });
});

module.exports = { app, server, io };