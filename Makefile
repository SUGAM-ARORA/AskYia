PYTHON?=python
PIP?=pip
NPM?=npm

.PHONY: fmt lint test backend frontend docker-up docker-down

fmt:
	cd backend && $(PIP) install -r requirements-dev.txt && $(PYTHON) -m black app
	cd frontend && $(NPM) install && $(NPM) run lint

lint:
	cd backend && $(PIP) install -r requirements-dev.txt && $(PYTHON) -m flake8 app
	cd frontend && $(NPM) install && $(NPM) run lint

backend:
	cd backend && $(PYTHON) -m venv .venv && . .venv/Scripts/activate && $(PIP) install -r requirements.txt && uvicorn app.main:app --reload

frontend:
	cd frontend && $(NPM) install && $(NPM) run dev

docker-up:
	docker compose -f infrastructure/docker/docker-compose.yml up --build

docker-down:
	docker compose -f infrastructure/docker/docker-compose.yml down
