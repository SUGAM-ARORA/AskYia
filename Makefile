.PHONY: help install dev build test lint format clean docker-up docker-down docker-build docker-logs migrate seed setup

# Colors
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# ============================================================================
# Help
# ============================================================================

help: ## Show this help message
	@echo '$(BLUE)Askyia - Development Commands$(NC)'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ============================================================================
# Setup
# ============================================================================

setup: ## Initial project setup
	@echo '$(YELLOW)Setting up project...$(NC)'
	@cp -n .env.example .env 2>/dev/null || true
	@cp -n backend/.env.example backend/.env 2>/dev/null || true
	@$(MAKE) install
	@echo '$(GREEN)Setup complete!$(NC)'

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend dependencies
	@echo '$(YELLOW)Installing backend dependencies...$(NC)'
	cd backend && pip install -r requirements.txt
	cd backend && pip install -r requirements-dev.txt

install-frontend: ## Install frontend dependencies
	@echo '$(YELLOW)Installing frontend dependencies...$(NC)'
	cd frontend && npm install

# ============================================================================
# Development
# ============================================================================

dev: ## Start development servers (frontend + backend)
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Start backend development server
	@echo '$(YELLOW)Starting backend server...$(NC)'
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend development server
	@echo '$(YELLOW)Starting frontend server...$(NC)'
	cd frontend && npm run dev

# ============================================================================
# Build
# ============================================================================

build: build-backend build-frontend ## Build all

build-backend: ## Build backend (placeholder)
	@echo '$(YELLOW)Building backend...$(NC)'
	@echo 'Backend is Python - no build step required'

build-frontend: ## Build frontend for production
	@echo '$(YELLOW)Building frontend...$(NC)'
	cd frontend && npm run build

# ============================================================================
# Testing
# ============================================================================

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo '$(YELLOW)Running backend tests...$(NC)'
	cd backend && pytest tests/ -v

test-backend-cov: ## Run backend tests with coverage
	@echo '$(YELLOW)Running backend tests with coverage...$(NC)'
	cd backend && pytest tests/ -v --cov=app --cov-report=html --cov-report=term

test-frontend: ## Run frontend tests
	@echo '$(YELLOW)Running frontend tests...$(NC)'
	cd frontend && npm run test || true

# ============================================================================
# Linting & Formatting
# ============================================================================

lint: lint-backend lint-frontend ## Lint all code

lint-backend: ## Lint backend code
	@echo '$(YELLOW)Linting backend...$(NC)'
	cd backend && ruff check .

lint-frontend: ## Lint frontend code
	@echo '$(YELLOW)Linting frontend...$(NC)'
	cd frontend && npm run lint

format: format-backend format-frontend ## Format all code

format-backend: ## Format backend code
	@echo '$(YELLOW)Formatting backend...$(NC)'
	cd backend && ruff format .
	cd backend && ruff check --fix .

format-frontend: ## Format frontend code
	@echo '$(YELLOW)Formatting frontend...$(NC)'
	cd frontend && npm run format || npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"

check: lint test ## Run all checks (lint + test)

# ============================================================================
# Database
# ============================================================================

migrate: ## Run database migrations
	@echo '$(YELLOW)Running migrations...$(NC)'
	cd backend && alembic upgrade head

migrate-new: ## Create a new migration (usage: make migrate-new msg="migration message")
	@echo '$(YELLOW)Creating new migration...$(NC)'
	cd backend && alembic revision --autogenerate -m "$(msg)"

migrate-down: ## Rollback last migration
	@echo '$(YELLOW)Rolling back migration...$(NC)'
	cd backend && alembic downgrade -1

seed: ## Seed the database
	@echo '$(YELLOW)Seeding database...$(NC)'
	cd backend && python seed_db.py

db-reset: ## Reset database (drop all tables and re-migrate)
	@echo '$(RED)Resetting database...$(NC)'
	cd backend && alembic downgrade base
	cd backend && alembic upgrade head
	@$(MAKE) seed

# ============================================================================
# Docker
# ============================================================================

docker-up: ## Start all Docker containers
	@echo '$(YELLOW)Starting Docker containers...$(NC)'
	docker-compose up -d

docker-down: ## Stop all Docker containers
	@echo '$(YELLOW)Stopping Docker containers...$(NC)'
	docker-compose down

docker-build: ## Build Docker images
	@echo '$(YELLOW)Building Docker images...$(NC)'
	docker-compose build

docker-rebuild: ## Rebuild Docker images (no cache)
	@echo '$(YELLOW)Rebuilding Docker images...$(NC)'
	docker-compose build --no-cache

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-logs-backend: ## View backend logs
	docker-compose logs -f backend

docker-logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

docker-shell-backend: ## Shell into backend container
	docker-compose exec backend bash

docker-shell-frontend: ## Shell into frontend container
	docker-compose exec frontend sh

docker-clean: ## Remove all containers and volumes
	@echo '$(RED)Cleaning Docker resources...$(NC)'
	docker-compose down -v --remove-orphans
	docker system prune -f

# ============================================================================
# Kubernetes
# ============================================================================

k8s-deploy: ## Deploy to Kubernetes (minikube)
	@echo '$(YELLOW)Deploying to Kubernetes...$(NC)'
	./infrastructure/kubernetes/deploy-all.sh --build --minikube

k8s-deploy-monitoring: ## Deploy monitoring stack
	@echo '$(YELLOW)Deploying monitoring...$(NC)'
	./infrastructure/kubernetes/deploy-monitoring.sh

k8s-deploy-logging: ## Deploy logging stack
	@echo '$(YELLOW)Deploying logging...$(NC)'
	./infrastructure/kubernetes/deploy-logging.sh

k8s-status: ## Show Kubernetes status
	@echo '$(BLUE)Askyia Namespace:$(NC)'
	kubectl get all -n askyia
	@echo ''
	@echo '$(BLUE)Monitoring Namespace:$(NC)'
	kubectl get all -n monitoring 2>/dev/null || echo 'Not deployed'
	@echo ''
	@echo '$(BLUE)Logging Namespace:$(NC)'
	kubectl get all -n logging 2>/dev/null || echo 'Not deployed'

k8s-clean: ## Clean up Kubernetes deployment
	@echo '$(RED)Cleaning Kubernetes resources...$(NC)'
	./infrastructure/kubernetes/cleanup.sh --all

# ============================================================================
# Utilities
# ============================================================================

clean: ## Clean build artifacts and caches
	@echo '$(YELLOW)Cleaning...$(NC)'
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	@echo '$(GREEN)Clean complete!$(NC)'

pre-commit-install: ## Install pre-commit hooks
	@echo '$(YELLOW)Installing pre-commit hooks...$(NC)'
	pip install pre-commit
	pre-commit install

pre-commit-run: ## Run pre-commit on all files
	@echo '$(YELLOW)Running pre-commit...$(NC)'
	pre-commit run --all-files

update-deps: ## Update all dependencies
	@echo '$(YELLOW)Updating dependencies...$(NC)'
	cd backend && pip install --upgrade -r requirements.txt
	cd frontend && npm update

security-scan: ## Run security scan
	@echo '$(YELLOW)Running security scan...$(NC)'
	pip install safety
	cd backend && safety check -r requirements.txt || true
	cd frontend && npm audit || true

docs-serve: ## Serve documentation locally
	@echo '$(YELLOW)Serving documentation...$(NC)'
	cd docs && python -m http.server 8080 || mkdocs serve

# ============================================================================
# Release
# ============================================================================

version: ## Show current version
	@echo '$(BLUE)Backend version:$(NC)'
	@grep -E "^__version__" backend/app/__init__.py 2>/dev/null || echo 'Not set'
	@echo '$(BLUE)Frontend version:$(NC)'
	@grep -E '"version"' frontend/package.json | head -1

release-patch: ## Create a patch release
	@echo '$(YELLOW)Creating patch release...$(NC)'
	./scripts/release.sh patch

release-minor: ## Create a minor release
	@echo '$(YELLOW)Creating minor release...$(NC)'
	./scripts/release.sh minor

release-major: ## Create a major release
	@echo '$(YELLOW)Creating major release...$(NC)'
	./scripts/release.sh major