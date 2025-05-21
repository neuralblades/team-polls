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

## Tech Stack

- **Backend**:
  - Node.js with Express
  - Socket.io for real-time communication
  - JWT for authentication
  - PostgreSQL for data persistence

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
4. **WebSockets**: Socket.io for real-time updates between clients

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running without Docker)

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

2. Access the application at http://localhost:5000

## Testing

Run the tests with:

```bash
npm test
```

## API Documentation

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
│   └── index.js            # Server entry point
├── scripts/                # Utility scripts
├── tests/                  # Test files
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker Compose configuration
└── Dockerfile              # Docker configuration
```

## License

MIT
