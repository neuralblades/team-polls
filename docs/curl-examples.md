# Team Polls API - cURL Examples

This document provides examples of how to interact with the Team Polls API using cURL.

## Authentication

### Get Anonymous Token

```bash
curl -X POST http://localhost:5001/api/auth/anon \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Polls

### Create Poll

```bash
curl -X POST http://localhost:5001/api/polls \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{
    "title": "Sample Poll",
    "description": "This is a sample poll",
    "options": ["Option 1", "Option 2", "Option 3"],
    "expiresAt": "2023-12-31T23:59:59Z"
  }'
```

Response:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Sample Poll",
  "description": "This is a sample poll",
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2023-01-01T12:00:00Z",
  "expires_at": "2023-12-31T23:59:59Z",
  "is_active": true,
  "options": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "text": "Option 1",
      "count": 0
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "text": "Option 2",
      "count": 0
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "text": "Option 3",
      "count": 0
    }
  ]
}
```

### Get All Polls

```bash
curl -X GET http://localhost:5001/api/polls
```

With pagination:

```bash
curl -X GET "http://localhost:5001/api/polls?limit=5&offset=0"
```

### Get Poll by ID

```bash
curl -X GET http://localhost:5001/api/polls/123e4567-e89b-12d3-a456-426614174000
```

### Vote on Poll

```bash
curl -X POST http://localhost:5001/api/polls/123e4567-e89b-12d3-a456-426614174000/vote \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{
    "optionId": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

## System

### Health Check

```bash
curl -X GET http://localhost:5001/health
```

Response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Metrics

```bash
curl -X GET http://localhost:5001/metrics
```

Response:

```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.03125

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.01",method="GET",route="/health",status_code="200"} 1
...

# HELP websocket_connections Current number of WebSocket connections
# TYPE websocket_connections gauge
websocket_connections 2

# HELP polls_created_total Total number of polls created
# TYPE polls_created_total counter
polls_created_total 5

# HELP votes_cast_total Total number of votes cast
# TYPE votes_cast_total counter
votes_cast_total 10
```

## WebSocket Communication

While not directly accessible via cURL, here's how to interact with the WebSocket API using JavaScript:

```javascript
// Connect to WebSocket server with authentication
const socket = io('http://localhost:5001', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join a poll room
socket.emit('poll:join', 'POLL_ID');

// Listen for poll data
socket.on('poll:data', (poll) => {
  console.log('Poll data:', poll);
});

// Listen for poll updates
socket.on('poll:update', (updatedPoll) => {
  console.log('Poll updated:', updatedPoll);
});

// Cast a vote
socket.emit('poll:vote', {
  pollId: 'POLL_ID',
  optionId: 'OPTION_ID'
});

// Leave a poll room
socket.emit('poll:leave', 'POLL_ID');

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```
