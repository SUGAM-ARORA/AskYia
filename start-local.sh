#!/bin/bash

# Local Development Startup Script (No Docker)

echo "🚀 Starting AskYia in Local Development Mode"
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/.venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd backend
    python -m venv .venv
    cd ..
fi

# Start backend
echo "🔧 Starting Backend..."
cd backend
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate
pip install -q -r requirements.txt
python seed_db.py &
BACKEND_PID=$!
uvicorn app.main:app --reload --port 8001 &
BACKEND_SERVER_PID=$!
cd ..

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "Frontend:    http://localhost:5173"
echo "Backend:     http://localhost:8001"
echo "API Docs:    http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $BACKEND_SERVER_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
