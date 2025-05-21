# Team Polls API Documentation

This document provides comprehensive documentation for the Team Polls API, including endpoints, request/response formats, and example cURL commands.

## Base URL

- Local Development: `http://localhost:5001`
- Production: `https://your-production-url.com`

## Authentication

All API endpoints except for the anonymous authentication endpoint require a JWT token in the `x-auth-token` header.

### Get Anonymous Token

```
POST /api/auth/anon
```

Creates a new anonymous user and returns a JWT token.

**Request Body**: None required

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5001/api/auth/anon
```

## Polls

### List All Polls

```
GET /api/polls
```

Returns a list of all active polls.

**Headers**:
- `x-auth-token`: JWT token

**Response**:
```json
[
  {
    "id": "poll-id-1",
    "title": "Sample Poll 1",
    "description": "This is a sample poll",
    "created_by": "user-id",
    "created_at": "2023-05-20T12:00:00Z",
    "expires_at": "2023-05-27T12:00:00Z",
    "is_active": true,
    "total_votes": 10
  },
  {
    "id": "poll-id-2",
    "title": "Sample Poll 2",
    "description": "Another sample poll",
    "created_by": "user-id",
    "created_at": "2023-05-21T12:00:00Z",
    "expires_at": "2023-05-28T12:00:00Z",
    "is_active": true,
    "total_votes": 5
  }
]
```

**cURL Example**:
```bash
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:5001/api/polls
```

### Create a Poll

```
POST /api/polls
```

Creates a new poll.

**Headers**:
- `x-auth-token`: JWT token

**Request Body**:
```json
{
  "title": "New Poll",
  "description": "This is a new poll",
  "options": ["Option 1", "Option 2", "Option 3"],
  "expiresAt": "2023-06-01T12:00:00Z"
}
```

**Response**:
```json
{
  "id": "new-poll-id",
  "title": "New Poll",
  "description": "This is a new poll",
  "created_by": "user-id",
  "created_at": "2023-05-22T12:00:00Z",
  "expires_at": "2023-06-01T12:00:00Z",
  "is_active": true,
  "options": [
    {
      "id": "option-id-1",
      "text": "Option 1",
      "votes": "0"
    },
    {
      "id": "option-id-2",
      "text": "Option 2",
      "votes": "0"
    },
    {
      "id": "option-id-3",
      "text": "Option 3",
      "votes": "0"
    }
  ],
  "total_votes": 0
}
```

**cURL Example**:
```bash
curl -X POST -H "x-auth-token: YOUR_TOKEN" -H "Content-Type: application/json" -d '{"title":"New Poll","description":"This is a new poll","options":["Option 1","Option 2","Option 3"],"expiresAt":"2023-06-01T12:00:00Z"}' http://localhost:5001/api/polls
```

### Get Poll Details

```
GET /api/polls/:id
```

Returns details for a specific poll.

**Headers**:
- `x-auth-token`: JWT token

**Response**:
```json
{
  "id": "poll-id",
  "title": "Sample Poll",
  "description": "This is a sample poll",
  "created_by": "user-id",
  "created_at": "2023-05-20T12:00:00Z",
  "expires_at": "2023-05-27T12:00:00Z",
  "is_active": true,
  "options": [
    {
      "id": "option-id-1",
      "text": "Option 1",
      "votes": "5"
    },
    {
      "id": "option-id-2",
      "text": "Option 2",
      "votes": "3"
    },
    {
      "id": "option-id-3",
      "text": "Option 3",
      "votes": "2"
    }
  ],
  "total_votes": 10
}
```

**cURL Example**:
```bash
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:5001/api/polls/poll-id
```

### Vote on a Poll

```
POST /api/polls/:id/vote
```

Casts a vote for a specific option in a poll.

**Headers**:
- `x-auth-token`: JWT token

**Request Body**:
```json
{
  "optionId": "option-id-1"
}
```

**Response**:
```json
{
  "id": "poll-id",
  "title": "Sample Poll",
  "description": "This is a sample poll",
  "created_by": "user-id",
  "created_at": "2023-05-20T12:00:00Z",
  "expires_at": "2023-05-27T12:00:00Z",
  "is_active": true,
  "options": [
    {
      "id": "option-id-1",
      "text": "Option 1",
      "votes": "6"
    },
    {
      "id": "option-id-2",
      "text": "Option 2",
      "votes": "3"
    },
    {
      "id": "option-id-3",
      "text": "Option 3",
      "votes": "2"
    }
  ],
  "total_votes": 11
}
```

**cURL Example**:
```bash
curl -X POST -H "x-auth-token: YOUR_TOKEN" -H "Content-Type: application/json" -d '{"optionId":"option-id-1"}' http://localhost:5001/api/polls/poll-id/vote
```

## WebSocket Events

The Team Polls application uses WebSockets for real-time updates. Here are the events you can listen for and emit:

### Connection

Connect to the WebSocket server:

```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Events to Listen For

#### `poll:update`

Emitted when a poll is updated (e.g., when someone votes).

```javascript
socket.on('poll:update', (updatedPoll) => {
  console.log('Poll updated:', updatedPoll);
});
```

#### `error`

Emitted when an error occurs.

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Events to Emit

#### `poll:join`

Join a poll room to receive updates for a specific poll.

```javascript
socket.emit('poll:join', 'poll-id');
```

#### `poll:leave`

Leave a poll room.

```javascript
socket.emit('poll:leave', 'poll-id');
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- General API endpoints: 100 requests per minute
- Voting endpoints: 5 requests per second

When rate limits are exceeded, the API will return a 429 Too Many Requests response.

## Metrics

The application exposes metrics in Prometheus format at the `/metrics` endpoint.

**cURL Example**:
```bash
curl http://localhost:5001/metrics
```

## Horizontal Scaling

The application is designed to scale horizontally. To run multiple instances:

```bash
docker-compose up -d --scale server=3
```

This will start 3 instances of the server behind the Nginx load balancer. WebSocket connections will be synchronized across instances using Redis.
