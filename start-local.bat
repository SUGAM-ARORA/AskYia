@echo off
echo 🚀 Starting AskYia in Local Development Mode
echo.

REM Start backend
echo 🔧 Starting Backend...
cd backend
if not exist .venv (
    echo 📦 Creating Python virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate
pip install -q -r requirements.txt
start "Backend" cmd /k "uvicorn app.main:app --reload --port 8001"
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting Frontend...
cd frontend
call npm install
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ All services started!
echo.
echo Frontend:    http://localhost:5173
echo Backend:     http://localhost:8001
echo API Docs:    http://localhost:8001/docs
echo.
echo Note: Default credentials:
echo   Email: admin@askyia.com
echo   Password: admin123
echo.
pause
