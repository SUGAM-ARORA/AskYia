#!/bin/bash

set -e

echo "🚀 Setting up Askyia development environment"
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Create environment files
echo -e "${YELLOW}Creating environment files...${NC}"
cp -n .env.example .env 2>/dev/null || echo ".env already exists"
cp -n backend/.env.example backend/.env 2>/dev/null || echo "backend/.env already exists"

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

cd ..

# Setup frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend
npm install
cd ..

# Setup pre-commit hooks
echo -e "${YELLOW}Setting up pre-commit hooks...${NC}"
pip install pre-commit
pre-commit install

# Start services
echo -e "${YELLOW}Starting Docker services (PostgreSQL, ChromaDB)...${NC}"
docker-compose up -d postgres chromadb

# Wait for services
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
cd backend
source venv/bin/activate
alembic upgrade head
python seed_db.py || true
cd ..

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}✅ Development environment setup complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "To start developing:"
echo ""
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo ""
echo "  docker-compose up"
echo ""
echo "Or use Make:"
echo ""
echo "  make dev"
echo ""