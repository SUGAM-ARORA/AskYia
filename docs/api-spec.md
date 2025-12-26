# API Specification

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

Most endpoints require JWT bearer token authentication.

**Header:**
```
Authorization: Bearer <token>
```

---

## Endpoints

### Health

#### `GET /health/ping`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Auth

#### `POST /auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

#### `POST /auth/login`
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### Workflows

#### `POST /workflows/validate`
Validate a workflow definition.

**Request Body:**
```json
{
  "definition": {
    "nodes": [...],
    "edges": [...],
    "knowledge_base_enabled": true
  }
}
```

**Response:**
```json
{
  "valid": true
}
```

or

```json
{
  "valid": false,
  "reason": "Missing nodes"
}
```

#### `POST /workflows/execute`
Execute a workflow with a query.

**Request Body:**
```json
{
  "definition": {
    "nodes": [...],
    "edges": [...],
    "knowledge_base_enabled": true
  },
  "query": "What is the capital of France?",
  "prompt": "Answer concisely.",
  "web_search": false
}
```

**Response:**
```json
{
  "result": {
    "answer": "Paris is the capital of France."
  }
}
```

---

### Documents

#### `POST /documents/upload`
Upload a document for knowledge base ingestion.

**Request:**
- `Content-Type: multipart/form-data`
- Form field: `file`

**Response:**
```json
{
  "chunks": 12,
  "stored": true
}
```

---

### Chat

#### `POST /chat/ask`
Ask a question through the workflow.

**Request Body:**
```json
{
  "workflow_definition": {
    "nodes": [...],
    "edges": [...],
    "knowledge_base_enabled": true
  },
  "query": "Explain the document",
  "prompt": "Be detailed",
  "web_search": false
}
```

**Response:**
```json
{
  "answer": "The document discusses..."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid credentials"
}
```

### 401 Unauthorized
```json
{
  "detail": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "detail": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## WebSocket (Future)

WebSocket endpoint for real-time workflow execution updates:
```
ws://localhost:8000/ws
```

---

## Rate Limiting

Not currently implemented; consider adding for production.

---

## Versioning

API is versioned via URL path: `/api/v1`
