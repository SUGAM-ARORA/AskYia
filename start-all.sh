#!/bin/bash
# /f/AskYia/start-all.sh
# Starts both main stack and monitoring stack

echo "🚀 Starting Askyia Complete Stack..."
echo ""

# Step 1: Start main stack
echo "📦 Starting Main Stack (Frontend, Backend, DB)..."
cd /f/AskYia
docker-compose up -d

echo "⏳ Waiting for main stack to initialize..."
sleep 15

# Check main stack
echo ""
echo "📊 Main Stack Status:"
docker-compose ps

# Step 2: Start monitoring stack
echo ""
echo "📈 Starting Monitoring Stack (ELK, Prometheus, Grafana)..."
cd /f/AskYia/infrastructure/docker

docker-compose up -d

echo "⏳ Waiting for monitoring stack to initialize..."
sleep 20

# Check monitoring stack
echo ""
echo "📊 Monitoring Stack Status:"
docker-compose ps

# Final status
echo ""
echo "============================================"
echo "🎉 All services started!"
echo "============================================"
echo ""
echo "🌐 Access URLs:"
echo "  ┌─────────────────────────────────────────┐"
echo "  │ Application                             │"
echo "  ├─────────────────────────────────────────┤"
echo "  │ Frontend:      http://localhost:5173    │"
echo "  │ Backend API:   http://localhost:8001    │"
echo "  │ API Docs:      http://localhost:8001/docs│"
echo "  │ Metrics:       http://localhost:8001/metrics│"
echo "  ├─────────────────────────────────────────┤"
echo "  │ Monitoring & Logging                    │"
echo "  ├─────────────────────────────────────────┤"
echo "  │ Kibana:        http://localhost:5601    │"
echo "  │ Prometheus:    http://localhost:9090    │"
echo "  │ Grafana:       http://localhost:3000    │"
echo "  │                (admin / askyia2024)     │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "📝 Commands:"
echo "  View main logs:       cd /f/AskYia && docker-compose logs -f"
echo "  View monitoring logs: cd /f/AskYia/infrastructure/docker && docker-compose logs -f"
echo "  Stop all:             ./stop-all.sh"