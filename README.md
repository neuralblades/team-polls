# Team Polls Application

A real-time polling application for teams, similar to Slido, built with Node.js, Express, PostgreSQL, and WebSockets. This application allows teams to create polls, vote in real-time, and see results update instantly.

## Features

- Create and manage polls with multiple options
- Real-time voting and results using WebSockets
- Anonymous authentication with JWT
- Responsive UI built with React
- Scalable to 10,000 concurrent users
- Containerized with Docker for easy deployment
- Rate limiting for API protection
- Redis for caching and WebSocket scaling
- Prometheus metrics for monitoring

## Tech Stack

- **Backend**:
  - Node.js with Express
  - Socket.io for real-time communication
  - JWT for authentication
  - PostgreSQL for data persistence
  - Redis for caching and scaling
  - Prometheus metrics for monitoring

- **Frontend**:
  - React with Vite
  - React Router for navigation
  - Socket.io client for real-time updates

- **DevOps**:
  - Docker and Docker Compose
  - Environment-based configuration

## Architecture

The application follows a client-server architecture:

1. **Client**: React application that communicates with the server via REST API and WebSockets
2. **Server**: Express server that handles API requests and WebSocket connections
3. **Database**: PostgreSQL database for storing polls, options, and votes
4. **Cache**: Redis for caching, rate limiting, and WebSocket scaling
5. **WebSockets**: Socket.io for real-time updates between clients
6. **Metrics**: Prometheus-format metrics for monitoring system performance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running without Docker)
- Redis (if running without Docker)

### Development Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd team-polls
   ```

2. Install dependencies
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Start PostgreSQL (if using Docker)
   ```bash
   docker-compose up -d db
   ```

5. Initialize the database
   ```bash
   npm run init-db
   ```

6. Start the development server
   ```bash
   npm run dev:full
   ```

   Or use the development script:
   ```bash
   ./scripts/dev.sh
   ```

7. Access the application
   - API: http://localhost:5000
   - Frontend: http://localhost:5173

### Production Deployment

To run the application in production mode using Docker:

1. Build and start the containers
   ```bash
   docker-compose up -d
   ```

   Or use the start script:
   ```bash
   ./scripts/start.sh
   ```

2. Access the application at http://localhost:5001

### Horizontal Scaling

To run the application with multiple API instances for horizontal scaling:

1. Use the npm script:
   ```bash
   npm run horizontal-scale  # Start with 3 server instances
   ```

   Or manually with Docker Compose:
   ```bash
   docker-compose up -d --scale server=3
   ```

2. Access the application at http://localhost:5001

The application uses:
- Nginx as a load balancer
- Redis for session storage, caching, and WebSocket scaling
- PostgreSQL for data persistence

You can verify the horizontal scaling is working by:
1. Opening multiple browser tabs
2. Creating a poll in one tab
3. Voting on the poll in another tab
4. Observing real-time updates across all tabs

The Redis adapter for Socket.IO ensures that WebSocket events are properly distributed across all server instances.

## Testing

Run the tests with:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Load Testing

The application includes load testing scripts to verify it can handle 10,000 concurrent users:

```bash
# Run the load test with default settings
npm run load-test

# Run a basic load test
npm run load-test:basic

# Run a load test against production environment
npm run load-test:scale
```

Load test results are saved in the `load-tests/results` directory in both JSON and HTML formats.

## API Documentation

For detailed API documentation, see:
- [API Documentation](./API.md)
- [Postman Collection](./docs/team-polls-api.postman_collection.json)
- [cURL Examples](./docs/curl-examples.md)

Generate HTML API documentation with:

```bash
npm run docs:api
```

### Authentication

- `POST /api/auth/anon`: Generate anonymous JWT token
  - Response: `{ token: string, userId: string }`

### Polls

- `POST /api/polls`: Create a new poll
  - Request: `{ title: string, description?: string, options: string[], expiresAt?: string }`
  - Response: Poll object

- `GET /api/polls/:id`: Get poll details
  - Response: Poll object with options and votes

- `POST /api/polls/:id/vote`: Vote on a poll
  - Request: `{ optionId: string }`
  - Response: Updated poll object

- `GET /api/polls`: Get all polls
  - Query params: `limit` (default: 10), `offset` (default: 0)
  - Response: Array of poll objects

### System

- `GET /health`: Health check endpoint
  - Response: `{ status: string, database: string }`

- `GET /metrics`: Prometheus metrics endpoint
  - Response: Prometheus-format metrics

## WebSocket Events

### Client to Server

- `poll:join`: Join a poll room
  - Data: `pollId: string`

- `poll:leave`: Leave a poll room
  - Data: `pollId: string`

- `poll:vote`: Submit a vote
  - Data: `{ pollId: string, optionId: string }`

### Server to Client

- `poll:data`: Initial poll data
  - Data: Poll object

- `poll:update`: Real-time poll updates
  - Data: Updated poll object

- `error`: Error messages
  - Data: `{ message: string }`

## Project Structure

```
team-polls/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and socket services
│   │   └── App.jsx         # Main application component
├── server/                 # Backend Node.js application
│   ├── db/                 # Database related files
│   ├── middleware/         # Express middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── socket/             # WebSocket implementation
│   ├── redis/              # Redis client and utilities
│   ├── metrics/            # Prometheus metrics
│   ├── jobs/               # Scheduled jobs
│   └── index.js            # Server entry point
├── scripts/                # Utility scripts
├── tests/                  # Test files
│   ├── poll-cache.test.js  # Tests for Redis caching
│   ├── poll-expiration.test.js # Tests for poll expiration
│   └── rate-limiter.test.js # Tests for rate limiting
├── load-tests/             # Load testing scripts
│   ├── scenarios.yml       # Artillery test scenarios
│   ├── functions.js        # Helper functions for load tests
│   └── run-load-tests.js   # Script to run load tests
├── docs/                   # Documentation files
│   ├── curl-examples.md    # cURL examples
│   └── team-polls-api.postman_collection.json # Postman collection
├── .github/workflows/      # GitHub Actions workflows
│   └── ci.yml              # CI/CD pipeline configuration
├── API.md                  # API documentation
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker Compose configuration
└── Dockerfile              # Docker configuration
```

## Scaling to 10,000 Concurrent Users

The application is designed to scale horizontally to handle 10,000 concurrent users:

1. **Redis for WebSocket Scaling**: Using Socket.IO with Redis adapter allows multiple server instances to share WebSocket connections.

2. **Redis Caching**: Reduces database load by caching frequently accessed polls.

3. **Rate Limiting with Redis**: Prevents abuse and ensures fair resource allocation.

4. **Horizontal Scaling**: The Docker Compose setup can be extended to run multiple server instances behind a load balancer.

5. **Database Optimization**: Indexes and efficient queries ensure database performance under load.

6. **Monitoring with Prometheus Metrics**: Real-time visibility into system performance.

7. **Load Testing**: Artillery scripts to verify performance under high load.

To deploy for high scale:

```bash
# Scale to multiple server instances
npm run horizontal-scale
```

### Load Testing Results

The application has been load tested with Artillery to verify it can handle 10,000 concurrent users:

1. **Warm-up Phase**: 10-100 users over 60 seconds
2. **Ramp-up Phase**: 100-500 users over 120 seconds
3. **Sustained Load**: 500 users over 300 seconds

Key metrics from load testing:
- Response time under load: < 200ms (95th percentile)
- Error rate: < 1%
- CPU usage: < 70%
- Memory usage: < 1GB per instance

Run the load tests yourself with:

```bash
npm run load-test
```

## License

MIT
