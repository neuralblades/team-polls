const { Pool } = require('pg');

// Determine if we're running in Docker
const isDocker = process.env.NODE_ENV === 'production';

// Set the appropriate host based on environment
const dbHost = isDocker ? 'db' : process.env.DB_HOST;

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log('Environment:', process.env.NODE_ENV);
console.log('Running in Docker:', isDocker);
console.log('Host:', dbHost);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

const pool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Test if tables exist
    const tableTest = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'polls'
      );
    `);

    const tablesExist = tableTest.rows[0].exists;
    console.log('Tables exist:', tablesExist);

    return true;
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
};

// Attempt to connect
testConnection();

// Wrapper for query to handle errors
const query = async (text, params) => {
  try {
    console.log('Executing query:', text);
    console.log('With params:', params || 'none');
    const result = await pool.query(text, params);
    console.log('Query successful, rows returned:', result.rowCount);
    return result;
  } catch (err) {
    console.error('Error executing query:', err.message);
    console.error('Query text:', text);
    console.error('Query params:', params || 'none');
    throw err;
  }
};

module.exports = {
  query,
  pool,
  testConnection
};
