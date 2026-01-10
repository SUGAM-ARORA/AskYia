# Contributing to Askyia

First off, thank you for considering contributing to Askyia! It's people like you that make Askyia such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@askyia.dev.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Git** (>= 2.30)
- **Python** (>= 3.11)
- **Node.js** (>= 20.x)
- **Docker** and **Docker Compose**
- **PostgreSQL** (for local development without Docker)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/SUGAM-ARORA/askyia.git
cd askyia

Add the upstream repository:
bash
git remote add upstream https://github.com/ORIGINAL_OWNER/askyia.git
Development Setup
Option 1: Using Docker (Recommended)
bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
Option 2: Local Development
Backend Setup
bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
Frontend Setup
bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
Option 3: Using Dev Container (VS Code)
Install the "Dev Containers" extension in VS Code
Open the project folder
Click "Reopen in Container" when prompted
Wait for the container to build
How to Contribute
Types of Contributions
We welcome many types of contributions:

🐛 Bug fixes: Fix issues and improve stability
✨ New features: Add new functionality
📝 Documentation: Improve or add documentation
🧪 Tests: Add or improve test coverage
🎨 UI/UX: Improve the user interface
♻️ Refactoring: Improve code quality
🌐 Translations: Help translate the project
Finding Issues to Work On
Look for issues labeled good first issue for beginner-friendly tasks
Issues labeled help wanted are great for contributors
Check the project board for planned work
Working on an Issue
Comment on the issue to let others know you're working on it
Create a new branch from main:
bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
Make your changes
Write or update tests
Update documentation if needed
Submit a pull request
Pull Request Process
Before Submitting
Update your branch with the latest changes from main:
bash
git fetch upstream
git rebase upstream/main
Run all tests:
bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend tests
cd frontend && npm run test
Run linters:
bash
# Backend
cd backend && ruff check . && ruff format .

# Frontend
cd frontend && npm run lint
Update documentation if you've changed APIs or added features
Submitting the PR
Push your branch to your fork:
bash
git push origin feature/your-feature-name
Open a Pull Request against the main branch
Fill out the PR template completely
Link any related issues using keywords (e.g., "Fixes #123")
Request review from maintainers
After Submitting
Respond to feedback and make requested changes
Keep your PR up to date with the main branch
Once approved, a maintainer will merge your PR
Style Guidelines
Python (Backend)
We use Ruff for linting and formatting:

bash
# Check for issues
ruff check .

# Auto-fix issues
ruff check --fix .

# Format code
ruff format .
Key guidelines:

Follow PEP 8
Use type hints for function arguments and return values
Write docstrings for public functions and classes
Maximum line length: 88 characters
TypeScript/JavaScript (Frontend)
We use ESLint and Prettier:

bash
# Lint
npm run lint

# Format
npm run format
Key guidelines:

Use TypeScript for all new code
Use functional components with hooks
Follow React best practices
Use meaningful variable and function names
CSS/Styling
Use Tailwind CSS utility classes
Follow component-based styling
Maintain responsive design
Commit Messages
We follow Conventional Commits:

text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
Types
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
test: Adding or updating tests
chore: Maintenance tasks
perf: Performance improvements
ci: CI/CD changes
build: Build system changes
Examples
bash
feat(workflow): add support for conditional nodes

fix(api): resolve race condition in workflow execution

docs(readme): update installation instructions

test(backend): add unit tests for LLM service
Reporting Bugs
Before Submitting
Check the existing issues to avoid duplicates
Try to reproduce the bug on the latest version
Collect relevant information (logs, screenshots, etc.)
Submitting a Bug Report
Use the bug report template and include:

Clear, descriptive title
Steps to reproduce
Expected behavior
Actual behavior
Environment details (OS, browser, versions)
Relevant logs or screenshots
Suggesting Features
Before Submitting
Check existing feature requests
Consider if the feature aligns with the project's goals
Think about implementation details
Submitting a Feature Request
Use the feature request template and include:

Clear description of the problem it solves
Proposed solution
Alternative solutions considered
Additional context or mockups
Community
Getting Help
💬 GitHub Discussions - Ask questions and discuss
📖 Documentation - Read the docs
🐛 Issue Tracker - Report bugs
Stay Updated
⭐ Star the repository to show support
👀 Watch the repository for updates
🐦 Follow us on Twitter @askyia_dev
Thank you for contributing to Askyia! 🎉

