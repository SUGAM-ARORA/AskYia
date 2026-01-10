#!/bin/bash

echo "🚀 Setting up Askyia development environment..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd /workspace/backend
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd /workspace/frontend
npm install

# Set up pre-commit hooks
echo "🔧 Setting up pre-commit hooks..."
cd /workspace
pre-commit install

# Initialize database
echo "🗄️ Initializing database..."
cd /workspace/backend
python -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())" || true

echo "✅ Development environment setup complete!"
echo ""
echo "To start developing:"
echo "  Backend:  cd backend && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"