#!/bin/bash

# Build and start the application with Docker Compose
echo "Building and starting Team Polls application..."
docker-compose up -d

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Initialize the database
echo "Initializing database..."
docker-compose exec app npm run init-db

echo "Team Polls application is now running!"
echo "API: http://localhost:5000"
echo "Frontend: http://localhost:5000 (in production mode)"
