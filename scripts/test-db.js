require('dotenv').config();
const { Pool } = require('pg');

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

async function testConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');

    // Test if tables exist
    console.log('Testing if tables exist...');
    const tableTest = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'polls'
      );
    `);
    
    const tablesExist = tableTest.rows[0].exists;
    console.log('Tables exist:', tablesExist);

    if (tablesExist) {
      // List all tables
      console.log('Listing all tables:');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      tablesResult.rows.forEach(row => {
        console.log('- ' + row.table_name);
      });
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

testConnection();
