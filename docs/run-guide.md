# Run Guide

Practical commands to start the frontend, backend, and supporting services across local dev, Docker Compose, and Kubernetes/Helm.

## Prerequisites
- Node.js 20+ and npm
- Python 3.12+
- Docker + docker-compose
- (Optional) kubectl + a running cluster (minikube/kind/any) and Helm 3+

## Environment
1. Copy and fill secrets:
   ```bash
   cp .env.example .env
   ```
2. Set API keys (OpenAI/Gemini/SerpAPI/Brave) and DB URL as needed.

## Local Development (separate processes)
### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```
- Configure `VITE_API_BASE_URL` to point to the backend (e.g., `http://localhost:8000/api/v1`).

### Datastores (local default)
- PostgreSQL + ChromaDB via Docker Compose (see below) or use your own instances and update `.env`.

## Docker Compose (one-shot stack)
```bash
make docker-up
# or
docker compose -f infrastructure/docker/docker-compose.yml up --build
```
Services and ports:
- Frontend: http://localhost:4173
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432
- ChromaDB: localhost:8001

Stop:
```bash
make docker-down
# or
docker compose -f infrastructure/docker/docker-compose.yml down
```

## Kubernetes (optional)
Apply base manifests (namespace, deployments, services, ingress):
```bash
kubectl apply -f infrastructure/kubernetes/base/
```
Verify:
```bash
kubectl get pods -n askyia
kubectl get svc -n askyia
```
Access (minikube example):
```bash
minikube service frontend -n askyia
```

## Helm (optional)
Install/upgrade the chart:
```bash
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia --create-namespace
# upgrade later
helm upgrade askyia infrastructure/helm/workflow-builder -n askyia
```
Configure via `infrastructure/helm/workflow-builder/values.yaml`.

## Monitoring (optional)
Prometheus + Grafana:
```bash
kubectl apply -f infrastructure/kubernetes/monitoring/
kubectl port-forward svc/grafana -n askyia 3000:3000
```

## Logging (optional)
ELK stack:
```bash
kubectl apply -f infrastructure/kubernetes/logging/
kubectl port-forward svc/kibana -n askyia 5601:5601
```

## Troubleshooting
- Backend fails to start: check `DATABASE_URL`, DB connectivity, and missing env vars.
- Frontend cannot reach backend: verify `VITE_API_BASE_URL` and CORS; ensure backend is running.
- Docker build issues on Windows: ensure Docker Desktop is running and file paths have no spaces.
- K8s: confirm current context/namespace; check pod logs with `kubectl logs -n askyia <pod>`.
