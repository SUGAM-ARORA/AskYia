@echo off
REM /f/AskYia/start-all.bat
REM Starts both main stack and monitoring stack

echo 🚀 Starting Askyia Complete Stack...
echo.

REM Step 1: Start main stack
echo 📦 Starting Main Stack (Frontend, Backend, DB)...
cd /d F:\AskYia
docker-compose up -d

echo ⏳ Waiting for main stack to initialize...
timeout /t 15 /nobreak > nul

echo.
echo 📊 Main Stack Status:
docker-compose ps

REM Step 2: Start monitoring stack
echo.
echo 📈 Starting Monitoring Stack (ELK, Prometheus, Grafana)...
cd /d F:\AskYia\infrastructure\docker

docker-compose up -d

echo ⏳ Waiting for monitoring stack to initialize...
timeout /t 20 /nobreak > nul

echo.
echo 📊 Monitoring Stack Status:
docker-compose ps

echo.
echo ============================================
echo 🎉 All services started!
echo ============================================
echo.
echo 🌐 Access URLs:
echo   Frontend:      http://localhost:5173
echo   Backend API:   http://localhost:8001
echo   API Docs:      http://localhost:8001/docs
echo   Metrics:       http://localhost:8001/metrics
echo   Kibana:        http://localhost:5601
echo   Prometheus:    http://localhost:9090
echo   Grafana:       http://localhost:3000 (admin / askyia2024)
echo.
pause