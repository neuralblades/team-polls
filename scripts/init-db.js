require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initializeDatabase() {
  try {
    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../server/db/schema.sql'), 'utf8');

    console.log('Connecting to database...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);

    // Create a connection pool
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Get a client from the pool
    const client = await pool.connect();

    console.log('Connected to database. Executing schema...');

    // Execute the schema SQL
    await client.query(schemaSQL);

    console.log('Schema executed successfully!');

    // Release the client back to the pool
    client.release();

    // Close the pool
    await pool.end();

    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
