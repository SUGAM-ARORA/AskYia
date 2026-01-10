FROM mcr.microsoft.com/devcontainers/python:1-3.11-bullseye

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g npm@latest

# Set up non-root user
USER vscode

# Install Python tools
RUN pip install --user \
    ruff \
    mypy \
    pytest \
    pytest-asyncio \
    pytest-cov \
    pre-commit

WORKDIR /workspace