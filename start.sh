#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 AskYia Startup Script 🚀      ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Stop any running containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose down

echo ""
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker-compose build

echo ""
echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📊 Service Status:${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 Access URLs:${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Frontend:${NC}      http://localhost:5173"
echo -e "${GREEN}Backend API:${NC}   http://localhost:8001"
echo -e "${GREEN}API Docs:${NC}      http://localhost:8001/docs"
echo -e "${GREEN}PostgreSQL:${NC}    localhost:5432"
echo -e "${GREEN}ChromaDB:${NC}      http://localhost:8000"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}👤 Default Login Credentials:${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Admin User:${NC}"
echo -e "  Email:    admin@askyia.com"
echo -e "  Password: admin123"
echo ""
echo -e "${YELLOW}Test User:${NC}"
echo -e "  Email:    test@askyia.com"
echo -e "  Password: test123"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📝 Useful Commands:${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "View logs:           ${YELLOW}docker-compose logs -f${NC}"
echo -e "View backend logs:   ${YELLOW}docker-compose logs -f backend${NC}"
echo -e "View frontend logs:  ${YELLOW}docker-compose logs -f frontend${NC}"
echo -e "Stop all:            ${YELLOW}docker-compose down${NC}"
echo -e "Restart all:         ${YELLOW}docker-compose restart${NC}"
echo -e "Rebuild:             ${YELLOW}docker-compose up -d --build${NC}"
echo ""
echo -e "${GREEN}✨ Happy building!${NC}"
echo ""
