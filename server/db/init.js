const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function initializeDatabase() {
  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('Initializing database...');
    await pool.query(schemaSQL);
    console.log('Database initialized successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
