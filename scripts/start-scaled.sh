#!/bin/bash

# Start the Team Polls application with horizontal scaling

# Number of API instances to run
INSTANCES=${1:-3}

echo "Starting Team Polls with $INSTANCES API instances..."

# Build the images
echo "Building Docker images..."
docker-compose build

# Start the database and Redis first
echo "Starting database and Redis..."
docker-compose up -d db redis

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Start the frontend
echo "Starting frontend..."
docker-compose up -d frontend

# Start the API instances
echo "Starting $INSTANCES API instances..."
docker-compose up -d --scale app=$INSTANCES app

# Start the Nginx load balancer
echo "Starting Nginx load balancer..."
docker-compose up -d nginx

echo "Team Polls is now running with $INSTANCES API instances"
echo "Frontend: http://localhost:5001"
echo "API: http://localhost:5001/api"
echo "Health check: http://localhost:5001/health"
echo "Metrics: http://localhost:5001/metrics"

# Show running containers
echo "Running containers:"
docker-compose ps
