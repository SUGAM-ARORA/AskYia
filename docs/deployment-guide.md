# Deployment Guide

## Prerequisites

- Docker and docker-compose
- Node.js 20+ and npm (for local frontend dev)
- Python 3.11+ (for local backend dev)
- Kubernetes cluster (optional, for K8s deployment)
- Helm 3+ (optional, for Helm deployment)

---

## Local Development

### 1. Environment Setup

Copy `.env.example` to `.env` and populate:

```bash
cp .env.example .env
```

**Required variables:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workflow
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
SERPAPI_API_KEY=...
BRAVE_API_KEY=...
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Database Setup

Run migrations:

```bash
cd backend
alembic upgrade head
```

Or initialize tables manually:

```bash
python -m app.db.init_db
```

---

## Docker Compose Deployment

### Build and Run

```bash
make docker-up
```

or

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

Services:
- Frontend: `http://localhost:4173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- ChromaDB: `localhost:8001`

### Stop

```bash
make docker-down
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured

### Deploy Base Components

```bash
kubectl apply -f infrastructure/kubernetes/base/
```

This deploys:
- Namespace: `askyia`
- Frontend, Backend, PostgreSQL, ChromaDB
- Services and Ingress

### Verify Deployment

```bash
kubectl get pods -n askyia
kubectl get services -n askyia
```

### Access Application

If using minikube:

```bash
minikube service frontend -n askyia
```

Or configure Ingress for your cluster.

---

## Helm Deployment

### Install Chart

```bash
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace
```

### Update Configuration

Edit `infrastructure/helm/workflow-builder/values.yaml` and upgrade:

```bash
helm upgrade askyia infrastructure/helm/workflow-builder \
  -n askyia
```

### Uninstall

```bash
helm uninstall askyia -n askyia
```

---

## Monitoring Setup (Optional)

### Prometheus + Grafana

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/
```

Access Grafana:
```bash
kubectl port-forward svc/grafana -n askyia 3000:3000
```

Default credentials: `admin / admin`

Add Prometheus data source: `http://prometheus:9090`

---

## Logging Setup (Optional)

### ELK Stack

```bash
kubectl apply -f infrastructure/kubernetes/logging/
```

Access Kibana:
```bash
kubectl port-forward svc/kibana -n askyia 5601:5601
```

Configure Elasticsearch URL: `http://elasticsearch:9200`

---

## Environment Variables Reference

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |
| `SERPAPI_API_KEY` | SerpAPI key | Optional |
| `BRAVE_API_KEY` | Brave Search API key | Optional |
| `CHROMADB_HOST` | ChromaDB host | Yes |
| `CHROMADB_PORT` | ChromaDB port | Yes |
| `LOG_LEVEL` | Logging level | No (default: info) |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_WS_URL` | WebSocket URL (future) | No |

---

## Production Considerations

1. **Secrets Management**: Use Kubernetes Secrets or external vault
2. **TLS/SSL**: Configure Ingress with cert-manager
3. **Database**: Use managed PostgreSQL (AWS RDS, etc.)
4. **Scaling**: Increase replicas in deployments
5. **Monitoring**: Configure alerts in Prometheus/Grafana
6. **Logging**: Centralize logs with ELK or cloud provider
7. **Backups**: Regular database and volume backups

---

## Troubleshooting

### Backend won't start
- Check database connectivity
- Verify environment variables
- Check logs: `docker logs <container>` or `kubectl logs <pod>`

### Frontend can't reach backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Ensure backend is running

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure network connectivity

### ChromaDB issues
- Verify ChromaDB is running on correct port
- Check `CHROMADB_HOST` and `CHROMADB_PORT`

---

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t frontend:${{ github.sha }} ./frontend
          docker build -t backend:${{ github.sha }} ./backend
      - name: Push to registry
        run: |
          # Push to your container registry
      - name: Deploy to K8s
        run: |
          # kubectl apply or helm upgrade
```

---

## Support

For issues and questions, refer to:
- [Architecture documentation](./architecture.md)
- [API specification](./api-spec.md)
- [README](../README.md)
