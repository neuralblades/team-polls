#!/bin/bash

# Start PostgreSQL with Docker
echo "Starting PostgreSQL database..."
docker-compose up -d db

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Initialize the database
echo "Initializing database..."
npm run init-db

# Start the development server
echo "Starting development server..."
npm run dev:full

echo "Team Polls application is now running in development mode!"
echo "API: http://localhost:5000"
echo "Frontend: http://localhost:5173"
