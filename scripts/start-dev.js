const { spawn } = require('child_process');
const path = require('path');

// Start the server with the correct environment variables
const server = spawn('node', [path.join(__dirname, '../server/index.js')], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: 5000,
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_NAME: 'team_polls',
    DB_USER: 'postgres',
    DB_PASSWORD: 'postgres',
    JWT_SECRET: faf9a7a3e2b888c3f4df1d3001ee2d205eb7127e6097518002f2f29c5bb683a9,
    JWT_EXPIRATION: '24h',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX: 100
  },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Stopping server...');
  server.kill('SIGTERM');
});
