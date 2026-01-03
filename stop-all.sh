#!/bin/bash
# /f/AskYia/stop-all.sh
# Stops both stacks

echo "🛑 Stopping all Askyia services..."

# Stop monitoring stack first
echo "Stopping monitoring stack..."
cd /f/AskYia/infrastructure/docker
docker-compose down

# Stop main stack
echo "Stopping main stack..."
cd /f/AskYia
docker-compose down

echo "✅ All services stopped!"