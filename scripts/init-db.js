require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../server/db/schema.sql'), 'utf8');

    // Write schema to a temporary file
    const tempFilePath = path.join(__dirname, 'temp-schema.sql');
    fs.writeFileSync(tempFilePath, schemaSQL);

    console.log('Executing schema using Docker...');

    // Execute the SQL file using docker exec
    const dockerCpCmd = `docker cp "${tempFilePath}" teampolls-db-1:/tmp/schema.sql`;
    const dockerExecCmd = `docker exec teampolls-db-1 psql -U postgres -d team_polls -f /tmp/schema.sql`;

    console.log('Copying schema to container...');
    exec(dockerCpCmd, (cpError, cpStdout, cpStderr) => {
      if (cpError) {
        console.error('Error copying schema to container:', cpError);
        console.error(cpStderr);
        // Remove the temporary file
        fs.unlinkSync(tempFilePath);
        process.exit(1);
      }

      console.log('Executing schema in container...');
      exec(dockerExecCmd, (execError, execStdout, execStderr) => {
        // Remove the temporary file
        fs.unlinkSync(tempFilePath);

        if (execError) {
          console.error('Error executing schema in container:', execError);
          console.error(execStderr);
          process.exit(1);
        }

        console.log(execStdout);
        console.log('Database initialized successfully!');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
