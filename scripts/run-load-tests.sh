#!/bin/bash

# Run load tests for the Team Polls application

# Ensure the application is running
echo "Checking if the application is running..."
if ! curl -s http://localhost:5001/health > /dev/null; then
  echo "Application is not running. Please start it with 'docker-compose up -d' first."
  exit 1
fi

# Create output directory
mkdir -p tests/load-tests/results

# Run basic load test
echo "Running basic load test..."
npm run load-test -- --output tests/load-tests/results/basic-results.json

# Wait a bit for the system to recover
echo "Waiting for system to recover..."
sleep 10

# Run heavy load test
echo "Running heavy load test..."
npm run load-test:heavy -- --output tests/load-tests/results/heavy-results.json

echo "Load tests completed. Results are in tests/load-tests/results/ directory."
