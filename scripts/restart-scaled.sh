#!/bin/bash

# Stop all containers
echo "Stopping all containers..."
docker-compose down

# Rebuild the images
echo "Rebuilding images..."
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
echo "Starting API instances with scaling..."
docker-compose up -d --scale app=3 app

# Start the Nginx load balancer
echo "Starting Nginx load balancer..."
docker-compose up -d nginx

# Start Prometheus and Grafana
echo "Starting monitoring tools..."
docker-compose up -d prometheus grafana

echo "Team Polls application has been restarted with scaling!"
echo "Frontend: http://localhost:5001"
echo "API: http://localhost:5001/api"
echo "Health check: http://localhost:5001/health"
echo "Metrics: http://localhost:5001/metrics"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000"

# Show running containers
echo "Running containers:"
docker-compose ps
