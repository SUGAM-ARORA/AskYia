# Askyia

Askyia — Ask. Connect. Execute.

Askyia is a full-stack no-code/low-code AI workflow platform for visual question-answering pipelines. Users compose drag-and-drop components (User Query, Knowledge Base, LLM Engine, Output), validate the DAG, and chat through the assembled stack.

## Stack
- Frontend: React + TypeScript + Vite, React Flow, Zustand
- Backend: FastAPI, SQLAlchemy (PostgreSQL), ChromaDB, OpenAI/Gemini, SerpAPI/Brave
- Infra: Docker, docker-compose, optional Kubernetes/Helm, Prometheus/Grafana, ELK

## Quick Start (local, dev)
1. Create and populate `.env` from `.env.example`.
2. Backend
   - `cd backend`
   - `python -m venv .venv && . .venv/Scripts/activate`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload`
3. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open the Vite dev URL and set `VITE_API_BASE_URL` to the backend URL.

## Docker (dev convenience)
```sh
make docker-up
```
Services: frontend (Vite preview), backend (uvicorn), postgres, chromadb. Prometheus/Grafana/ELK manifests are under `infrastructure/kubernetes` and `infrastructure/helm`.

## Project Highlights
- React Flow canvas with component library, config panel, execution controls, and chat modal.
- Workflow validation and execution pipeline exposed via FastAPI `/api/v1`.
- Knowledge base ingestion with PyMuPDF extraction, OpenAI/Gemini embeddings, and ChromaDB vector search.
- LLM engine supports OpenAI/Gemini with optional SerpAPI/Brave web search and prompt injection.
- Optional persistence: workflows, documents, chat history, execution logs.
- Structured logging and metrics for observability.

## Testing
- Frontend: `npm run test` (placeholder)
- Backend: `pytest`

## Deployment
- Dockerfiles for frontend and backend.
- `infrastructure/docker/docker-compose.yml` for local stack.
- Kubernetes base manifests and Helm chart under `infrastructure/kubernetes` and `infrastructure/helm`.

## Repository Structure

```
askyia/
├── frontend/           # React + TypeScript + Vite + React Flow
├── backend/            # FastAPI + SQLAlchemy + async Python
├── infrastructure/     # Docker, Kubernetes, Helm, monitoring, logging
├── docs/               # Architecture, API spec, deployment guide
├── .github/            # Copilot instructions
├── README.md
├── .env.example
└── Makefile
```

## Features Implemented

### Core Requirements
- ✅ Visual workflow builder with React Flow
- ✅ Four component types: User Query, Knowledge Base, LLM Engine, Output
- ✅ Document upload and text extraction
- ✅ Vector embeddings with ChromaDB
- ✅ Multi-LLM support (OpenAI GPT, Gemini)
- ✅ Web search integration (SerpAPI/Brave)
- ✅ Chat interface with follow-up queries
- ✅ Workflow validation and execution
- ✅ PostgreSQL for persistence
- ✅ JWT authentication

### Optional Requirements
- ✅ Workflow save/load schema (models and repos ready)
- ✅ Chat history persistence (models and repos ready)
- ✅ Structured logging (structlog)
- ✅ Docker and docker-compose
- ✅ Kubernetes manifests
- ✅ Helm chart
- ✅ Prometheus + Grafana setup
- ✅ ELK Stack setup

### Code Quality
- Clean architecture (repositories, services, components)
- Type safety (TypeScript + Pydantic)
- Async/await throughout backend
- State management with Zustand
- Modular and extensible design
- Production-ready structure

## Demo Video

> [Include link to video demo here]

Follow [docs/video-demo-script.md](docs/video-demo-script.md) for recording guidance.

## Documentation

- [Architecture Overview](docs/architecture.md) – System design and component details
- [API Specification](docs/api-spec.md) – Endpoint documentation
- [Deployment Guide](docs/deployment-guide.md) – Local, Docker, K8s, Helm instructions
- [Video Demo Script](docs/video-demo-script.md) – Recording guide
- [Run Guide](docs/run-guide.md) – How to start frontend, backend, and supporting services

## Important Notes

- **API Keys**: Replace all keys in `.env` with valid credentials
- **Figma Design**: Reference link placeholder in [architecture.md](docs/architecture.md)
- **Production**: Review deployment guide for security, scaling, monitoring
- **Testing**: Backend test structure ready; frontend tests placeholder

## Assignment Deliverables Checklist

- ✅ Full source code (frontend + backend)
- ✅ README with setup and run instructions
- ✅ Clear component structure and modular design
- 🎬 Video demo or screen recording (to be recorded)
- ✅ Architecture diagram and documentation
- ✅ Docker + Kubernetes + Helm deployment
- ✅ Monitoring (Prometheus/Grafana) and Logging (ELK)

## License

Created with   by Sugam Arora
