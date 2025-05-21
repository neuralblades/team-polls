const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
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
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Error executing query:', err.message);
    throw err;
  }
};

module.exports = {
  query,
  pool,
  testConnection
};
