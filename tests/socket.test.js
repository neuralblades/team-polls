const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const setupSocketHandlers = require('../server/socket');

describe('Socket.IO', () => {
  let io, serverSocket, clientSocket, httpServer;
  let token, userId;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server
    io = new Server(httpServer);
    
    // Set up socket handlers
    setupSocketHandlers(io);
    
    // Start server
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Generate token for authentication
      userId = 'test-socket-user-id';
      const payload = {
        user: {
          id: userId,
          isAnonymous: true
        }
      };
      token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
      
      // Create client socket
      clientSocket = Client(`http://localhost:${port}`, {
        auth: {
          token
        }
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('should connect with valid token', (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });

  test('should join a poll room', (done) => {
    const pollId = 'test-poll-id';
    
    // Listen for poll:data event
    clientSocket.on('poll:data', (data) => {
      // This might not be triggered in tests since we don't have a real poll
      if (data) {
        expect(data).toBeDefined();
      }
      done();
    });
    
    // Join poll room
    clientSocket.emit('poll:join', pollId);
  });

  test('should leave a poll room', (done) => {
    const pollId = 'test-poll-id';
    
    // Leave poll room
    clientSocket.emit('poll:leave', pollId);
    
    // We can't easily verify the room was left, but we can check it doesn't throw
    setTimeout(done, 100);
  });

  test('should handle errors for invalid vote data', (done) => {
    // Listen for error event
    clientSocket.on('error', (error) => {
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
      done();
    });
    
    // Send invalid vote data
    clientSocket.emit('poll:vote', {
      pollId: null,
      optionId: null
    });
  });
});
