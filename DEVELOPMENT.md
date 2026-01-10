# Development Guide

This guide provides detailed information for developers working on Askyia.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Database](#database)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)

## Architecture Overview
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React) │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Workflow │ │ Chat │ │ Config │ │
│ │ Canvas │ │ Interface │ │ Panel │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (FastAPI) │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Workflow │ │ LLM │ │ Knowledge │ │
│ │ Engine │ │ Service │ │ Base │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
┌───────────────┼───────────────┐
▼ ▼ ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ PostgreSQL│ │ ChromaDB │ │ LLM APIs │
│ (Metadata)│ │ (Vectors)│ │(OpenAI/..)│
└──────────┘ └──────────┘ └──────────┘

text

## Project Structure
askyia/
├── backend/ # FastAPI Backend
│ ├── app/
│ │ ├── api/ # API routes
│ │ │ ├── v1/
│ │ │ │ ├── endpoints/ # Route handlers
│ │ │ │ └── router.py # API router
│ │ │ └── deps.py # Dependencies
│ │ ├── core/ # Core functionality
│ │ │ ├── config.py # Settings
│ │ │ ├── security.py # Auth utilities
│ │ │ └── logging.py # Logging config
│ │ ├── db/ # Database
│ │ │ ├── base.py # Base model
│ │ │ ├── session.py # DB session
│ │ │ └── init_db.py # DB initialization
│ │ ├── models/ # SQLAlchemy models
│ │ ├── schemas/ # Pydantic schemas
│ │ ├── services/ # Business logic
│ │ │ ├── llm/ # LLM integrations
│ │ │ ├── knowledge/ # Knowledge base
│ │ │ └── workflow/ # Workflow engine
│ │ └── main.py # Application entry
│ ├── alembic/ # Database migrations
│ ├── tests/ # Backend tests
│ └── requirements.txt # Python dependencies
│
├── frontend/ # React Frontend
│ ├── src/
│ │ ├── components/ # React components
│ │ │ ├── canvas/ # Workflow canvas
│ │ │ ├── chat/ # Chat interface
│ │ │ ├── nodes/ # Node components
│ │ │ └── ui/ # UI components
│ │ ├── hooks/ # Custom hooks
│ │ ├── services/ # API services
│ │ ├── stores/ # Zustand stores
│ │ ├── types/ # TypeScript types
│ │ ├── utils/ # Utilities
│ │ ├── App.tsx # Root component
│ │ └── main.tsx # Entry point
│ ├── public/ # Static assets
│ └── package.json # NPM dependencies
│
├── infrastructure/ # DevOps & Deployment
│ ├── docker/ # Docker configs
│ ├── kubernetes/ # K8s manifests
│ └── helm/ # Helm charts
│
├── docs/ # Documentation
└── scripts/ # Utility scripts

text

## Backend Development

### Setting Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up environment variables
cp .env.example .env
Running the Backend
bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
API Documentation
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
OpenAPI JSON: http://localhost:8000/openapi.json
Creating a New Endpoint
Create the schema in app/schemas/:
python
# app/schemas/example.py
from pydantic import BaseModel

class ExampleCreate(BaseModel):
    name: str
    description: str | None = None

class ExampleResponse(BaseModel):
    id: int
    name: str
    description: str | None

    class Config:
        from_attributes = True
Create the model in app/models/:
python
# app/models/example.py
from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
Create the service in app/services/:
python
# app/services/example_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.example import Example
from app.schemas.example import ExampleCreate

class ExampleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ExampleCreate) -> Example:
        example = Example(**data.model_dump())
        self.db.add(example)
        await self.db.commit()
        await self.db.refresh(example)
        return example
Create the endpoint in app/api/v1/endpoints/:
python
# app/api/v1/endpoints/examples.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas.example import ExampleCreate, ExampleResponse
from app.services.example_service import ExampleService

router = APIRouter()

@router.post("/", response_model=ExampleResponse)
async def create_example(
    data: ExampleCreate,
    db: AsyncSession = Depends(get_db)
):
    service = ExampleService(db)
    return await service.create(data)
Register the router in app/api/v1/router.py:
python
from app.api.v1.endpoints import examples

api_router.include_router(
    examples.router,
    prefix="/examples",
    tags=["examples"]
)
Database Migrations
bash
# Create a new migration
alembic revision --autogenerate -m "Add example table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
Frontend Development
Setting Up the Frontend
bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
Creating a New Component
Create the component file:
tsx
// src/components/example/ExampleComponent.tsx
import React from 'react';

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Action
        </button>
      )}
    </div>
  );
};
Create an index file for exports:
tsx
// src/components/example/index.ts
export { ExampleComponent } from './ExampleComponent';
State Management with Zustand
tsx
// src/stores/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  items: string[];
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
  clearItems: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index)
    })),
  clearItems: () => set({ items: [] })
}));
API Services
tsx
// src/services/exampleService.ts
import { api } from './api';

export interface Example {
  id: number;
  name: string;
  description?: string;
}

export const exampleService = {
  getAll: async (): Promise<Example[]> => {
    const response = await api.get('/examples');
    return response.data;
  },

  getById: async (id: number): Promise<Example> => {
    const response = await api.get(`/examples/${id}`);
    return response.data;
  },

  create: async (data: Omit<Example, 'id'>): Promise<Example> => {
    const response = await api.post('/examples', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Example>): Promise<Example> => {
    const response = await api.put(`/examples/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/examples/${id}`);
  }
};
Database
PostgreSQL Commands
bash
# Connect to database (Docker)
docker exec -it askyia-postgres psql -U postgres -d workflow

# Common psql commands
\dt                    # List tables
\d table_name          # Describe table
\l                     # List databases
\q                     # Quit
ChromaDB
ChromaDB is used for vector storage. Access the API at http://localhost:8000.

python
# Example: Working with ChromaDB
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)

# Create a collection
collection = client.create_collection("documents")

# Add documents
collection.add(
    documents=["Document 1 content", "Document 2 content"],
    metadatas=[{"source": "file1"}, {"source": "file2"}],
    ids=["doc1", "doc2"]
)

# Query
results = collection.query(
    query_texts=["search query"],
    n_results=5
)
Testing
Backend Tests
bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_workflows.py -v

# Run specific test
pytest tests/test_workflows.py::test_create_workflow -v
Frontend Tests
bash
cd frontend

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
Debugging
Backend Debugging
VS Code: Use the launch configuration in .vscode/launch.json
Print debugging: Use the logger
python
from app.core.logging import logger

logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message", exc_info=True)
Interactive debugging:
python
import pdb; pdb.set_trace()  # Add breakpoint
Frontend Debugging
React DevTools: Install browser extension
Console logging: Use structured logging
tsx
console.log('[Component] Action:', { data });
VS Code: Use Chrome debugger launch config
Common Tasks
Adding a New LLM Provider
Create provider in backend/app/services/llm/providers/:
python
# backend/app/services/llm/providers/new_provider.py
from app.services.llm.base import BaseLLMProvider

class NewProvider(BaseLLMProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implementation
        pass

    async def generate_stream(self, prompt: str, **kwargs):
        # Implementation
        pass
Register in backend/app/services/llm/__init__.py
Adding a New Node Type
Create node component in frontend/src/components/nodes/:
tsx
// frontend/src/components/nodes/NewNode.tsx
import { Handle, Position } from 'reactflow';

export const NewNode = ({ data }) => {
  return (
    <div className="node new-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        {/* Node content */}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
Register in node types configuration
Add backend handler if needed
Updating Dependencies
bash
# Backend
cd backend
pip install --upgrade package-name
pip freeze > requirements.txt

# Frontend
cd frontend
npm update package-name
# or for major updates
npm install package-name@latest
For more information, see the Contributing Guide.