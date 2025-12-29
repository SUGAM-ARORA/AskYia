# Architecture Overview

## System Design

Askyia is a full-stack no-code platform for composing intelligent workflows using drag-and-drop components.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Askyia Studio)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │  Component   │  │   Workspace Panel    │  │   Configuration Panel        │  │
│  │   Library    │  │   (React Flow)       │  │   (Dynamic Forms)            │  │
│  │   Panel      │  │                      │  │                              │  │
│  └──────────────┘  └──────────────────────┘  └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    Chat Interface + Execution Controls                    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │ REST API / WebSocket
┌────────────────────────────────────┴────────────────────────────────────────────┐
│                            API GATEWAY (FastAPI)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Auth      │ │  Workflow   │ │  Document   │ │  Execution  │ │   Chat    │ │
│  │   Service   │ │  Service    │ │  Service    │ │  Engine     │ │  Service  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                │                │                │               │
         ▼                ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ PostgreSQL  │ │  ChromaDB   │ │   OpenAI/   │ │  SerpAPI/   │               │
│  │  Database   │ │ Vector Store│ │   Gemini    │ │   Brave     │               │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────────────┐
│                         MONITORING & LOGGING                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │   Prometheus     │  │     Grafana      │  │      ELK Stack               │  │
│  │   (Metrics)      │  │   (Dashboards)   │  │ (Elasticsearch+Logstash+     │  │
│  │                  │  │                  │  │        Kibana)               │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. User Query Component
- Entry point for user input
- Captures queries and passes them forward
- Minimal configuration required

### 2. Knowledge Base Component
- Document upload and text extraction (PyMuPDF)
- Embedding generation (OpenAI/Gemini)
- Vector storage and similarity search (ChromaDB)
- Context retrieval for LLM

### 3. LLM Engine Component
- Multi-provider LLM support (OpenAI GPT, Gemini)
- Optional web search integration (SerpAPI/Brave)
- Custom prompt injection
- Context-aware response generation

### 4. Output Component
- Chat interface presentation
- Response formatting
- Follow-up query handling

## Workflow Execution

The workflow executor implements a simplified DAG execution model:

1. **User Query** → extracts query string
2. **(Optional) Knowledge Base** → retrieves relevant context
3. **LLM Engine** → generates response with query + context + prompt + web search
4. **Output** → returns formatted answer

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for dev server and build
- **React Flow** for visual workflow editor
- **Zustand** for state management
- **Axios** for API calls

### Backend
- **FastAPI** with async/await
- **SQLAlchemy 2.0** with asyncpg
- **Alembic** for migrations
- **JWT** authentication
- **Structured logging** (structlog)

### Data Layer
- **PostgreSQL** for relational data
- **ChromaDB** for vector embeddings
- **OpenAI/Gemini** for embeddings and LLM
- **SerpAPI/Brave** for web search

### Infrastructure
- **Docker** and docker-compose
- **Kubernetes** manifests
- **Helm** charts
- **Prometheus** + **Grafana** for monitoring
- **ELK Stack** for logging

## Design Principles

1. **Modularity**: Each component is independent and composable
2. **Extensibility**: Easy to add new component types
3. **Observability**: Structured logging and metrics
4. **Scalability**: Stateless services, external vector store
5. **Developer Experience**: Clean separation of concerns, type safety

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Environment-based secrets
- CORS middleware
- Input validation with Pydantic

## Figma Design Reference

> [Figma Design URL placeholder - [assignment](https://www.figma.com/design/RVtXQB4bzKSlHrtejIQqMH/Assignment--FullStack-Engineer?node-id=0-1&p=f&t=4ZELPyGhGwi4THlR-0)]

## Future Enhancements

- Workflow versioning
- Component marketplace
- Advanced DAG validation
- Real-time collaboration
- Workflow templates library
