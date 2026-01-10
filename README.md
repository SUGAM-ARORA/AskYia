<div align="center">

# 🚀 Askyia

### Ask. Connect. Execute.

A full-stack no-code/low-code AI workflow platform for visual question answering pipelines.

[![CI](https://github.com/SUGAM-ARORA/askyia/actions/workflows/ci.yml/badge.svg)](https://github.com/SUGAM-ARORA/askyia/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue.svg)](https://kubernetes.io/)

[Documentation](./docs/README.md) •
[Quick Start](#-quick-start) •
[Features](#-features) •
[Contributing](./CONTRIBUTING.md) •
[Discord](https://discord.gg/askyia)

<img src="docs/assets/demo.gif" alt="Askyia Demo" width="800"/>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

Askyia is a powerful no-code/low-code platform that enables users to visually create and interact with intelligent AI workflows. Build complex question-answering pipelines by connecting drag-and-drop components, without writing code.

**Key Use Cases:**

- 📚 **Document Q&A**: Upload documents and ask questions using RAG
- 🤖 **AI Chatbots**: Create custom chatbots with specific knowledge bases
- 🔍 **Research Assistants**: Combine web search with LLM reasoning
- 🔄 **Automated Workflows**: Chain multiple AI operations together

## ✨ Features

### Core Features

|
 Feature 
|
 Description 
|
|
---------
|
-------------
|
|
 🎨 
**
Visual Workflow Builder
**
|
 Intuitive drag-and-drop interface using React Flow 
|
|
 📤 
**
Document Processing
**
|
 Upload and process PDFs with automatic text extraction 
|
|
 🧠 
**
Vector Embeddings
**
|
 Store and retrieve document embeddings with ChromaDB 
|
|
 🤖 
**
Multi-LLM Support
**
|
 OpenAI GPT, Google Gemini, and more 
|
|
 🔍 
**
Web Search
**
|
 Integrate real-time web search via SerpAPI or Brave 
|
|
 💬 
**
Chat Interface
**
|
 Interactive chat for workflow execution 
|
|
 🔐 
**
Authentication
**
|
 Secure JWT-based auth with OAuth support 
|
|
 📊 
**
Monitoring
**
|
 Built-in Prometheus metrics and Grafana dashboards 
|
|
 📋 
**
Logging
**
|
 Centralized logging with ELK stack 
|

### Workflow Components
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ User Query │────▶│ Knowledge Base │────▶│ LLM Engine │────▶│ Output │
│ Component │ │ Component │ │ Component │ │ Component │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
│ │ │ │
│ │ │ │
Accepts user Processes docs Generates Displays
queries as and retrieves responses final
input context using LLMs response

text

**1. User Query Component**
- Entry point for workflow
- Accepts natural language queries
- Forwards queries to connected components

**2. Knowledge Base Component**
- Upload and process documents (PDF, TXT, etc.)
- Extract text using PyMuPDF
- Generate embeddings (OpenAI, Gemini)
- Store in ChromaDB vector database
- Retrieve relevant context via semantic search

**3. LLM Engine Component**
- Connect to multiple LLM providers
- Accept query + optional context
- Support custom system prompts
- Optional web search integration
- Stream responses in real-time

**4. Output Component**
- Display formatted responses
- Chat-style interface
- Support follow-up questions
- Maintain conversation history

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev/) | UI Framework |
| [TypeScript](https://www.typescriptlang.org/) | Type Safety |
| [Vite](https://vitejs.dev/) | Build Tool |
| [React Flow](https://reactflow.dev/) | Workflow Canvas |
| [Zustand](https://zustand-demo.pmnd.rs/) | State Management |
| [TailwindCSS](https://tailwindcss.com/) | Styling |
| [Shadcn/ui](https://ui.shadcn.com/) | UI Components |

### Backend
| Technology | Purpose |
|------------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | API Framework |
| [Python 3.11+](https://www.python.org/) | Runtime |
| [SQLAlchemy](https://www.sqlalchemy.org/) | ORM |
| [Alembic](https://alembic.sqlalchemy.org/) | Migrations |
| [Pydantic](https://docs.pydantic.dev/) | Data Validation |
| [asyncpg](https://github.com/MagicStack/asyncpg) | Async PostgreSQL |

### AI & ML
| Technology | Purpose |
|------------|---------|
| [OpenAI API](https://openai.com/) | GPT Models & Embeddings |
| [Google Gemini](https://ai.google.dev/) | Gemini Models |
| [ChromaDB](https://www.trychroma.com/) | Vector Database |
| [PyMuPDF](https://pymupdf.readthedocs.io/) | PDF Processing |
| [SerpAPI](https://serpapi.com/) | Web Search |
| [Brave Search](https://brave.com/search/api/) | Web Search |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| [PostgreSQL](https://www.postgresql.org/) | Primary Database |
| [Docker](https://www.docker.com/) | Containerization |
| [Kubernetes](https://kubernetes.io/) | Orchestration |
| [Helm](https://helm.sh/) | K8s Package Manager |
| [Prometheus](https://prometheus.io/) | Metrics |
| [Grafana](https://grafana.com/) | Dashboards |
| [ELK Stack](https://www.elastic.co/) | Logging |

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- Or: Python 3.11+, Node.js 20+, PostgreSQL 15+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/SUGAM-ARORA/askyia.git
cd askyia

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit .env files with your API keys
# Required: OPENAI_API_KEY or GEMINI_API_KEY

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
Access the application:

🌐 Frontend: http://localhost:5173
🔧 Backend API: http://localhost:8001
📚 API Docs: http://localhost:8001/docs
Option 2: Local Development
bash
# Clone the repository
git clone https://github.com/SUGAM-ARORA/askyia.git
cd askyia

# Run setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Or manually:

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
Option 3: Using Make
bash
# Setup everything
make setup

# Start development servers
make dev

# Run tests
make test

# See all commands
make help
Option 4: Kubernetes (Minikube)
bash
# Start minikube
minikube start --cpus=4 --memory=8192

# Deploy application
chmod +x infrastructure/kubernetes/deploy-all.sh
./infrastructure/kubernetes/deploy-all.sh --all --minikube

# Get access URL
minikube ip
# Access at http://<minikube-ip>:30080
🏗️ Architecture
System Architecture
text
                                    ┌─────────────────────────────────────┐
                                    │            Load Balancer            │
                                    │         (Nginx Ingress)             │
                                    └──────────────┬──────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
           ┌────────────────┐            ┌────────────────┐            ┌────────────────┐
           │    Frontend    │            │    Backend     │            │   Static       │
           │    (React)     │◀──────────▶│   (FastAPI)    │            │   Assets       │
           │   Port: 5173   │    API     │   Port: 8000   │            │                │
           └────────────────┘            └───────┬────────┘            └────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
           ┌────────────────┐           ┌────────────────┐           ┌────────────────┐
           │   PostgreSQL   │           │    ChromaDB    │           │   External     │
           │   (Metadata)   │           │   (Vectors)    │           │   APIs         │
           │   Port: 5432   │           │   Port: 8000   │           │  (LLM, Search) │
           └────────────────┘           └────────────────┘           └────────────────┘
Data Flow
text
User Input ──▶ Frontend ──▶ Backend API ──▶ Workflow Engine
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
           ┌────────────────┐           ┌────────────────┐           ┌────────────────┐
           │  Query Node    │           │ Knowledge Base │           │   LLM Node     │
           │                │──────────▶│     Node       │──────────▶│                │
           │  Parse input   │           │ Retrieve docs  │  Context  │ Generate resp  │
           └────────────────┘           └────────────────┘           └───────┬────────┘
                                                                             │
                                                                             ▼
                                                                    ┌────────────────┐
                                                                    │  Output Node   │
                                                                    │                │
                                                                    │ Display result │
                                                                    └────────────────┘
Project Structure
text
askyia/
├── .devcontainer/          # VS Code Dev Container config
├── .github/                # GitHub Actions, templates
│   ├── workflows/          # CI/CD pipelines
│   └── ISSUE_TEMPLATE/     # Issue templates
├── .vscode/                # VS Code settings
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core config
│   │   ├── db/             # Database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Migrations
│   └── tests/              # Backend tests
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── infrastructure/         # DevOps
│   ├── docker/             # Docker configs
│   ├── kubernetes/         # K8s manifests
│   └── helm/               # Helm charts
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker Compose
├── Makefile                # Make commands
└── README.md               # This file
📚 Documentation
Document	Description
Development Guide	Setup and development instructions
Contributing Guide	How to contribute
API Documentation	Interactive API docs (Swagger)
Architecture	System architecture details
Deployment	Kubernetes deployment guide
Security	Security policy
🗺️ Roadmap
Version 1.0 (Current) ✅
 Visual workflow builder
 Core components (Query, Knowledge Base, LLM, Output)
 Document upload and processing
 Multi-LLM support (OpenAI, Gemini)
 Web search integration
 User authentication
 Docker deployment
 Kubernetes support
Version 1.1 (Q2 2026)
 Additional node types (Conditional, Loop, Code)
 Workflow templates library
 Collaboration features
 Webhook triggers
 Scheduled workflows
Version 1.2 (Q3 2026)
 Custom component builder
 Plugin system
 API marketplace
 Advanced analytics
 Mobile app
Version 2.0 (Q4 2026)
 Multi-agent workflows
 Voice interface
 Real-time collaboration
 Enterprise features
 On-premise deployment
🤝 Contributing
We love contributions! Please see our Contributing Guide for details.

Quick Contribution Steps
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Make your changes
Run tests (make test)
Commit (git commit -m 'feat: add amazing feature')
Push (git push origin feature/amazing-feature)
Open a Pull Request
Development Commands
bash
# Install dependencies
make install

# Start development servers
make dev

# Run tests
make test

# Lint code
make lint

# Format code
make format

# Build for production
make build
👥 Community
💬 GitHub Discussions - Ask questions
🐛 Issue Tracker - Report bugs
🐦 Twitter - Follow for updates
💼 Discord - Join our community
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
LangChain - Inspiration for workflow concepts
Langflow - UI/UX inspiration
React Flow - Workflow canvas library
FastAPI - Backend framework
ChromaDB - Vector database
⭐ Star us on GitHub if you find this project useful! ⭐

Made with ❤️ by the Askyia Team