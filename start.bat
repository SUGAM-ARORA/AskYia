@echo off
setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════╗
echo ║     🚀 AskYia Startup Script 🚀      ║
echo ╔═══════════════════════════════════════╗
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Stop any running containers
echo 🛑 Stopping any existing containers...
docker-compose down

echo.
echo 🔨 Building containers...
docker-compose build

echo.
echo 🚀 Starting all services...
docker-compose up -d

echo.
echo ✅ All services started!
echo.
echo ═══════════════════════════════════════
echo 📊 Service Status:
echo ═══════════════════════════════════════
docker-compose ps

echo.
echo ═══════════════════════════════════════
echo 🌐 Access URLs:
echo ═══════════════════════════════════════
echo Frontend:      http://localhost:5173
echo Backend API:   http://localhost:8001
echo API Docs:      http://localhost:8001/docs
echo PostgreSQL:    localhost:5432
echo ChromaDB:      http://localhost:8000
echo.
echo ═══════════════════════════════════════
echo 👤 Default Login Credentials:
echo ═══════════════════════════════════════
echo Admin User:
echo   Email:    admin@askyia.com
echo   Password: admin123
echo.
echo Test User:
echo   Email:    test@askyia.com
echo   Password: test123
echo.
echo ═══════════════════════════════════════
echo 📝 Useful Commands:
echo ═══════════════════════════════════════
echo View logs:           docker-compose logs -f
echo View backend logs:   docker-compose logs -f backend
echo View frontend logs:  docker-compose logs -f frontend
echo Stop all:            docker-compose down
echo Restart all:         docker-compose restart
echo Rebuild:             docker-compose up -d --build
echo.
echo ✨ Happy building!
echo.
pause
