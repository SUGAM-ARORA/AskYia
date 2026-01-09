# AskYia - Low Level Design (LLD)

## 1. Database Schema Design

### 1.1 Entity Relationship Diagram
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ USERS │ │ STACKS │ │ WORKFLOWS │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (PK) │ │ id (PK) │ │ id (PK) │
│ email │◄──┐ │ user_id (FK) │───┐ │ stack_id (FK) │
│ password_hash │ │ │ name │ │ │ name │
│ created_at │ │ │ description │ │ │ nodes (JSON) │
│ updated_at │ │ │ created_at │ │ │ edges (JSON) │
│ is_active │ │ │ updated_at │ │ │ created_at │
└─────────────────┘ │ └─────────────────┘ │ │ updated_at │
│ │ │ └─────────────────┘
│ │ │
│ ┌───────▼───────┐ │ ┌─────────────────┐
│ │ DOCUMENTS │ │ │ CHAT_SESSIONS │
│ ├───────────────┤ │ ├─────────────────┤
│ │ id (PK) │ └──▶│ id (PK) │
│ │ stack_id (FK) │ │ workflow_id(FK) │
│ │ filename │ │ user_id (FK) │
│ │ file_path │ │ created_at │
│ │ file_size │ └─────────────────┘
│ │ mime_type │ │
│ │ chunk_count │ │
│ │ created_at │ ┌────────▼────────┐
│ └───────────────┘ │ CHAT_MESSAGES │
│ ├─────────────────┤
│ │ id (PK) │
└─────────────────────────────│ session_id (FK) │
│ role │
│ content │
│ metadata (JSON) │
│ created_at │
└─────────────────┘

### 1.2 Table Definitions

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Stacks Table
CREATE TABLE stacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stacks_user_id ON stacks(user_id);

-- Workflows Table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stack_id, name)
);

CREATE INDEX idx_workflows_stack_id ON workflows(stack_id);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    chunk_count INTEGER DEFAULT 0,
    embedding_model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_stack_id ON documents(stack_id);

-- Chat Sessions Table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'error')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Execution Logs Table
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    node_id VARCHAR(100),
    node_type VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_execution_logs_workflow_id ON execution_logs(workflow_id);
CREATE INDEX idx_execution_logs_created_at ON execution_logs(created_at);
2. API Specifications
2.1 Authentication APIs
yaml
# POST /api/v1/auth/login
Request:
  Content-Type: application/json
  Body:
    email: string (required)
    password: string (required)

Response (200):
  access_token: string
  token_type: "bearer"
  expires_in: number

Response (401):
  detail: "Invalid credentials"

---

# POST /api/v1/auth/register
Request:
  Content-Type: application/json
  Body:
    email: string (required)
    password: string (required, min 8 chars)

Response (201):
  id: string (uuid)
  email: string
  created_at: string (ISO 8601)

Response (400):
  detail: "Email already registered"

---

# GET /api/v1/auth/me
Headers:
  Authorization: Bearer <token>

Response (200):
  id: string
  email: string
  is_admin: boolean
  created_at: string
2.2 Stack APIs
yaml
# GET /api/v1/stacks
Headers:
  Authorization: Bearer <token>

Response (200):
  items:
    - id: string
      name: string
      description: string
      workflow_count: number
      created_at: string
      updated_at: string

---

# POST /api/v1/stacks
Headers:
  Authorization: Bearer <token>
Request:
  name: string (required)
  description: string (optional)

Response (201):
  id: string
  name: string
  description: string
  created_at: string

---

# GET /api/v1/stacks/{stack_id}
Response (200):
  id: string
  name: string
  description: string
  workflows: array
  documents: array
  created_at: string
  updated_at: string

---

# PUT /api/v1/stacks/{stack_id}
Request:
  name: string (optional)
  description: string (optional)

Response (200):
  id: string
  name: string
  description: string
  updated_at: string

---

# DELETE /api/v1/stacks/{stack_id}
Response (204): No Content
2.3 Workflow APIs
yaml
# GET /api/v1/stacks/{stack_id}/workflows
Response (200):
  items:
    - id: string
      name: string
      node_count: number
      created_at: string
      updated_at: string

---

# POST /api/v1/stacks/{stack_id}/workflows
Request:
  name: string (required)
  nodes: array (required)
    - id: string
      type: string
      position: {x: number, y: number}
      data: object
  edges: array (required)
    - id: string
      source: string
      target: string
      sourceHandle: string
      targetHandle: string

Response (201):
  id: string
  name: string
  nodes: array
  edges: array
  created_at: string

---

# POST /api/v1/workflows/validate
Request:
  nodes: array
  edges: array

Response (200):
  valid: boolean
  errors: array
    - node_id: string
      message: string

---

# POST /api/v1/workflows/execute
Request:
  workflow_id: string (optional)
  definition: object (if no workflow_id)
    nodes: array
    edges: array
  query: string (required)
  web_search: boolean (default: false)

Response (200):
  result: string
  execution_id: string
  duration_ms: number
  nodes_executed: array
2.4 Chat APIs
yaml
# POST /api/v1/chat/ask
Request:
  query: string (required)
  workflow_definition: object (required)
    nodes: array
    edges: array
    knowledge_base_enabled: boolean
    model: string
    provider: string
    temperature: number
    web_search: boolean
  prompt: string (optional)
  session_id: string (optional)

Response (200):
  answer: string
  session_id: string
  sources: array (optional)
    - document: string
      chunk: string
      score: number
  web_results: array (optional)
    - title: string
      url: string
      snippet: string
  metadata:
    model: string
    tokens_used: number
    latency_ms: number

---

# GET /api/v1/chat/sessions
Response (200):
  items:
    - id: string
      title: string
      message_count: number
      created_at: string

---

# GET /api/v1/chat/sessions/{session_id}/messages
Response (200):
  items:
    - id: string
      role: string
      content: string
      created_at: string
2.5 Document APIs
yaml
# POST /api/v1/documents/upload
Headers:
  Content-Type: multipart/form-data
Request:
  file: binary (required)
  stack_id: string (required)

Response (201):
  id: string
  filename: string
  file_size: number
  chunk_count: number
  status: "processing" | "ready" | "error"

---

# GET /api/v1/documents/{document_id}/status
Response (200):
  id: string
  status: string
  chunk_count: number
  error_message: string (if error)

---

# DELETE /api/v1/documents/{document_id}
Response (204): No Content
3. Class Diagrams
3.1 Backend Services
text
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE CLASSES                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│     <<interface>>       │
│      LLMProvider        │
├─────────────────────────┤
│ + generate(prompt,      │
│   model, temperature)   │
│ + get_available_models()│
│ + count_tokens(text)    │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────────┐ ┌─────────────┐
│GeminiClient │ │OpenAIClient │
├─────────────┤ ├─────────────┤
│ - api_key   │ │ - api_key   │
│ - model     │ │ - model     │
├─────────────┤ ├─────────────┤
│ + generate()│ │ + generate()│
│ + stream()  │ │ + stream()  │
└─────────────┘ └─────────────┘


┌─────────────────────────┐
│    EmbeddingService     │
├─────────────────────────┤
│ - model: str            │
│ - dimension: int        │
├─────────────────────────┤
│ + embed_text(text)      │
│ + embed_batch(texts)    │
│ + get_dimension()       │
└─────────────────────────┘


┌─────────────────────────┐
│    VectorStoreService   │
├─────────────────────────┤
│ - client: ChromaClient │
│ - collection: str       │
├─────────────────────────┤
│ + add_documents(docs)   │
│ + search(query, k)      │
│ + delete(ids)           │
│ + get_collection_info() │
└─────────────────────────┘


┌─────────────────────────┐
│   WebSearchService      │
├─────────────────────────┤
│ - api_key: str          │
│ - max_results: int      │
├─────────────────────────┤
│ + search(query)         │
│ + format_results()      │
└─────────────────────────┘


┌─────────────────────────────────────────────┐
│            WorkflowExecutor                  │
├─────────────────────────────────────────────┤
│ - llm_service: LLMProvider                  │
│ - embedding_service: EmbeddingService       │
│ - vector_store: VectorStoreService          │
│ - web_search: WebSearchService              │
├─────────────────────────────────────────────┤
│ + execute(definition, query): str           │
│ + validate(definition): ValidationResult    │
│ - _parse_nodes(nodes): List[Node]           │
│ - _build_execution_order(nodes, edges)      │
│ - _execute_node(node, context): NodeResult  │
│ - _process_input_node(node, context)        │
│ - _process_llm_node(node, context)          │
│ - _process_kb_node(node, context)           │
│ - _process_output_node(node, context)       │
└─────────────────────────────────────────────┘
3.2 Frontend Components
text
┌─────────────────────────────────────────────────────────────────┐
│                     REACT COMPONENTS                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│       App (Root)        │
├─────────────────────────┤
│ - isAuthenticated       │
│ - currentView           │
├─────────────────────────┤
│ + render()              │
└───────────┬─────────────┘
            │
    ┌───────┴───────┬───────────────┐
    ▼               ▼               ▼
┌─────────┐  ┌───────────┐  ┌───────────────┐
│  Login  │  │ Dashboard │  │WorkflowBuilder│
└─────────┘  └───────────┘  └───────────────┘


┌─────────────────────────────────────────────┐
│              WorkflowBuilder                 │
├─────────────────────────────────────────────┤
│ Props:                                       │
│   (none - uses Zustand store)               │
├─────────────────────────────────────────────┤
│ State:                                       │
│ - nodes: Node[]                             │
│ - edges: Edge[]                             │
│ - zoom: number                              │
│ - isSaveModalOpen: boolean                  │
├─────────────────────────────────────────────┤
│ Methods:                                     │
│ + onConnect(params)                         │
│ + onDrop(event)                             │
│ + onNodeDragStop(node)                      │
│ + handleSave()                              │
│ + handleBuildStack()                        │
└─────────────────────────────────────────────┘


┌─────────────────────────────────────────────┐
│            BaseNode (Abstract)               │
├─────────────────────────────────────────────┤
│ Props:                                       │
│ - data: NodeData                            │
│ - id: string                                │
│ - selected: boolean                         │
├─────────────────────────────────────────────┤
│ State:                                       │
│ - isExpanded: boolean                       │
├─────────────────────────────────────────────┤
│ Methods:                                     │
│ + handleUpdate(updates)                     │
│ + renderHeader()                            │
│ + renderBody()                              │
│ + renderHandles()                           │
└─────────────────────────────────────────────┘
          │
          │ extends
    ┌─────┴─────┬─────────┬──────────┬─────────┐
    ▼           ▼         ▼          ▼         ▼
┌─────────┐ ┌───────┐ ┌────────┐ ┌────────┐ ┌────────┐
│InputNode│ │LLMNode│ │ KBNode │ │WebSearch│ │Output │
└─────────┘ └───────┘ └────────┘ └────────┘ └────────┘
4. Sequence Diagrams
4.1 User Login Flow
text
┌──────┐          ┌──────────┐          ┌─────────┐          ┌────────────┐
│Client│          │ Frontend │          │ Backend │          │  Database  │
└──┬───┘          └────┬─────┘          └────┬────┘          └─────┬──────┘
   │                   │                     │                      │
   │  Enter Credentials│                     │                      │
   │──────────────────>│                     │                      │
   │                   │                     │                      │
   │                   │  POST /auth/login   │                      │
   │                   │────────────────────>│                      │
   │                   │                     │                      │
   │                   │                     │  SELECT user         │
   │                   │                     │─────────────────────>│
   │                   │                     │                      │
   │                   │                     │  User data           │
   │                   │                     │<─────────────────────│
   │                   │                     │                      │
   │                   │                     │  Verify password     │
   │                   │                     │  (bcrypt)            │
   │                   │                     │                      │
   │                   │                     │  Generate JWT        │
   │                   │                     │                      │
   │                   │  {access_token}     │                      │
   │                   │<────────────────────│                      │
   │                   │                     │                      │
   │                   │  Store token        │                      │
   │                   │  (localStorage)     │                      │
   │                   │                     │                      │
   │  Redirect to      │                     │                      │
   │  Dashboard        │                     │                      │
   │<──────────────────│                     │                      │
   │                   │                     │                      │
4.2 Chat Query Execution Flow
text
┌──────┐       ┌──────────┐       ┌─────────┐       ┌─────────┐       ┌──────┐       ┌───────┐
│Client│       │ Frontend │       │ Backend │       │ChromaDB │       │Gemini│       │SerpAPI│
└──┬───┘       └────┬─────┘       └────┬────┘       └────┬────┘       └──┬───┘       └───┬───┘
   │                │                  │                 │               │               │
   │ Send Message   │                  │                 │               │               │
   │───────────────>│                  │                 │               │               │
   │                │                  │                 │               │               │
   │                │ POST /chat/ask   │                 │               │               │
   │                │─────────────────>│                 │               │               │
   │                │                  │                 │               │               │
   │                │                  │ Parse workflow  │               │               │
   │                │                  │ definition      │               │               │
   │                │                  │                 │               │               │
   │                │                  │ [If KB enabled] │               │               │
   │                │                  │ Generate embed  │               │               │
   │                │                  │────────────────────────────────>│               │
   │                │                  │                 │               │               │
   │                │                  │ Query embedding │               │               │
   │                │                  │<────────────────────────────────│               │
   │                │                  │                 │               │               │
   │                │                  │ Vector search   │               │               │
   │                │                  │────────────────>│               │               │
   │                │                  │                 │               │               │
   │                │                  │ Relevant chunks │               │               │
   │                │                  │<────────────────│               │               │
   │                │                  │                 │               │               │
   │                │                  │ [If Web Search] │               │               │
   │                │                  │─────────────────────────────────────────────────>│
   │                │                  │                 │               │               │
   │                │                  │ Search results  │               │               │
   │                │                  │<─────────────────────────────────────────────────│
   │                │                  │                 │               │               │
   │                │                  │ Build prompt    │               │               │
   │                │                  │ with context    │               │               │
   │                │                  │                 │               │               │
   │                │                  │ Generate response               │               │
   │                │                  │────────────────────────────────>│               │
   │                │                  │                 │               │               │
   │                │                  │ LLM response    │               │               │
   │                │                  │<────────────────────────────────│               │
   │                │                  │                 │               │               │
   │                │ {answer, meta}   │                 │               │               │
   │                │<─────────────────│                 │               │               │
   │                │                  │                 │               │               │
   │ Display Answer │                  │                 │               │               │
   │<───────────────│                  │                 │               │               │
   │                │                  │                 │               │               │
4.3 Document Upload & Embedding Flow
text
┌──────┐       ┌──────────┐       ┌─────────┐       ┌──────────┐       ┌─────────┐
│Client│       │ Frontend │       │ Backend │       │FileSystem│       │ChromaDB │
└──┬───┘       └────┬─────┘       └────┬────┘       └────┬─────┘       └────┬────┘
   │                │                  │                 │                  │
   │ Select File    │                  │                 │                  │
   │───────────────>│                  │                 │                  │
   │                │                  │                 │                  │
   │                │ POST /documents  │                 │                  │
   │                │ /upload          │                 │                  │
   │                │─────────────────>│                 │                  │
   │                │                  │                 │                  │
   │                │                  │ Save file       │                  │
   │                │                  │────────────────>│                  │
   │                │                  │                 │                  │
   │                │                  │ File saved      │                  │
   │                │                  │<────────────────│                  │
   │                │                  │                 │                  │
   │                │                  │ Extract text    │                  │
   │                │                  │ (PyMuPDF)       │                  │
   │                │                  │                 │                  │
   │                │                  │ Chunk text      │                  │
   │                │                  │ (512 tokens,    │                  │
   │                │                  │  50 overlap)    │                  │
   │                │                  │                 │                  │
   │                │                  │ For each chunk: │                  │
   │                │                  │ ┌─────────────┐ │                  │
   │                │                  │ │ Generate    │ │                  │
   │                │                  │ │ embedding   │ │                  │
   │                │                  │ └─────────────┘ │                  │
   │                │                  │                 │                  │
   │                │                  │ Store vectors   │                  │
   │                │                  │─────────────────────────────────> │
   │                │                  │                 │                  │
   │                │                  │ Stored          │                  │
   │                │                  │<─────────────────────────────────  │
   │                │                  │                 │                  │
   │                │ {id, status:     │                 │                  │
   │                │  "ready"}        │                 │                  │
   │                │<─────────────────│                 │                  │
   │                │                  │                 │                  │
   │ Upload Success │                  │                 │                  │
   │<───────────────│                  │                 │                  │
   │                │                  │                 │                  │
5. State Management Design
5.1 Zustand Store Structure
typescript
// Auth Store
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userEmail: string | null;
  
  // Actions
  login: (token: string, email: string) => void;
  logout: () => void;
  getUserInitial: () => string;
}

// Stack Store
interface StackState {
  stacks: Stack[];
  currentStack: Stack | null;
  
  // Actions
  setStacks: (stacks: Stack[]) => void;
  addStack: (stack: Stack) => void;
  updateStack: (id: string, updates: Partial<Stack>) => void;
  deleteStack: (id: string) => void;
  setCurrentStack: (stack: Stack | null) => void;
}

// Workflow Store
interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  isChatOpen: boolean;
  selectedNodeId: string | null;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  toggleChat: () => void;
  selectNode: (id: string | null) => void;
}

// Chat Store
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setSessionId: (id: string) => void;
}

## 6. Node Type Specifications

### 6.1 Node Interface Definition

```typescript
// Base Node Interface
interface BaseNodeData {
  label: string;
  onUpdate?: (updates: Partial<BaseNodeData>) => void;
}

// Input Node (User Query)
interface InputNodeData extends BaseNodeData {
  query: string;
}

// Output Handles: query (orange)
// Input Handles: none

// LLM Node
interface LLMNodeData extends BaseNodeData {
  provider: 'gemini' | 'openai';
  model: string;
  apiKey?: string;
  prompt: string;
  temperature: number;        // 0.0 - 2.0
  maxTokens?: number;         // max output tokens
  webSearch: boolean;
  serpApiKey?: string;
}

// Output Handles: output (blue)
// Input Handles: context (blue), query (orange)

// Knowledge Base Node
interface KnowledgeBaseNodeData extends BaseNodeData {
  file: File | string | null;
  embeddingModel: string;
  apiKey?: string;
  chunkSize?: number;         // default 512
  chunkOverlap?: number;      // default 50
  topK?: number;              // default 5
}

// Output Handles: context (orange)
// Input Handles: query (orange)

// Web Search Node
interface WebSearchNodeData extends BaseNodeData {
  searchEngine: 'google' | 'bing' | 'duckduckgo';
  apiKey?: string;
  maxResults: number;         // 1-20
}

// Output Handles: results (green)
// Input Handles: query (orange)

// Output Node
interface OutputNodeData extends BaseNodeData {
  output?: string;
  format?: 'text' | 'markdown' | 'json';
}

// Output Handles: none
// Input Handles: output (green)

// Conditional Node
interface ConditionalNodeData extends BaseNodeData {
  condition: string;          // JavaScript expression
  trueLabel?: string;
  falseLabel?: string;
}

// Output Handles: true (green), false (orange)
// Input Handles: input (purple)

// Transform Node
interface TransformNodeData extends BaseNodeData {
  transformType: 'template' | 'json' | 'extract' | 'uppercase' | 'lowercase' | 'trim';
  template?: string;          // for template type
  jsonPath?: string;          // for extract type
}

// Output Handles: output (blue)
// Input Handles: input (blue)

// API Node
interface APINodeData extends BaseNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  timeout?: number;           // ms, default 30000
}

// Output Handles: response (green)
// Input Handles: body (purple)

// Memory Node
interface MemoryNodeData extends BaseNodeData {
  memoryType: 'conversation' | 'summary' | 'window' | 'entity';
  maxMessages: number;        // 1-50
  sessionKey?: string;
}

// Output Handles: history (blue)
// Input Handles: input (purple), query (orange)

// Validator Node
interface ValidatorNodeData extends BaseNodeData {
  validationType: 'not_empty' | 'is_email' | 'is_url' | 'is_json' | 
                  'min_length' | 'max_length' | 'regex' | 'custom';
  customRule?: string;        // for regex or custom
  minLength?: number;
  maxLength?: number;
  errorMessage: string;
}

// Output Handles: valid (green), invalid (orange)
// Input Handles: input (blue)
6.2 Node Execution Logic
python
# backend/app/services/node_processors.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class NodeResult:
    success: bool
    output: Any
    error: Optional[str] = None
    metadata: Optional[Dict] = None

class BaseNodeProcessor(ABC):
    """Abstract base class for all node processors"""
    
    @abstractmethod
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        pass
    
    def get_input(self, context: Dict, handle_id: str) -> Any:
        """Get input value from context by handle ID"""
        return context.get(handle_id)


class InputNodeProcessor(BaseNodeProcessor):
    """Process User Query input nodes"""
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        query = node_data.get('query', '') or context.get('user_query', '')
        
        if not query:
            return NodeResult(
                success=False,
                output=None,
                error="No query provided"
            )
        
        return NodeResult(
            success=True,
            output={'query': query},
            metadata={'input_length': len(query)}
        )


class LLMNodeProcessor(BaseNodeProcessor):
    """Process LLM nodes with Gemini/OpenAI"""
    
    def __init__(self, llm_service):
        self.llm_service = llm_service
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        # Get inputs
        query = self.get_input(context, 'query') or context.get('query', '')
        doc_context = self.get_input(context, 'context') or ''
        
        # Build prompt
        prompt_template = node_data.get('prompt', 
            'CONTEXT: {context}\n\nUser Query: {query}')
        
        prompt = prompt_template.format(
            context=doc_context,
            query=query
        )
        
        # Get LLM settings
        provider = node_data.get('provider', 'gemini')
        model = node_data.get('model', 'gemini-2.0-flash')
        temperature = node_data.get('temperature', 0.7)
        
        try:
            response = await self.llm_service.generate(
                prompt=prompt,
                model=model,
                provider=provider,
                temperature=temperature
            )
            
            return NodeResult(
                success=True,
                output={'output': response},
                metadata={
                    'model': model,
                    'provider': provider,
                    'prompt_length': len(prompt)
                }
            )
        except Exception as e:
            return NodeResult(
                success=False,
                output=None,
                error=str(e)
            )


class KnowledgeBaseNodeProcessor(BaseNodeProcessor):
    """Process Knowledge Base nodes with RAG"""
    
    def __init__(self, embedding_service, vector_store):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        query = self.get_input(context, 'query') or context.get('query', '')
        
        if not query:
            return NodeResult(
                success=False,
                output=None,
                error="No query provided for knowledge base search"
            )
        
        top_k = node_data.get('topK', 5)
        
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)
            
            # Search vector store
            results = await self.vector_store.search(
                query_embedding=query_embedding,
                top_k=top_k
            )
            
            # Combine relevant chunks
            context_text = "\n\n---\n\n".join([
                r['content'] for r in results
            ])
            
            return NodeResult(
                success=True,
                output={'context': context_text},
                metadata={
                    'chunks_found': len(results),
                    'top_score': results[0]['score'] if results else 0
                }
            )
        except Exception as e:
            return NodeResult(
                success=False,
                output=None,
                error=str(e)
            )


class WebSearchNodeProcessor(BaseNodeProcessor):
    """Process Web Search nodes"""
    
    def __init__(self, web_search_service):
        self.web_search_service = web_search_service
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        query = self.get_input(context, 'query') or context.get('query', '')
        
        if not query:
            return NodeResult(
                success=False,
                output=None,
                error="No query provided for web search"
            )
        
        max_results = node_data.get('maxResults', 5)
        
        try:
            results = await self.web_search_service.search(
                query=query,
                max_results=max_results
            )
            
            # Format results as context
            formatted = "\n\n".join([
                f"**{r['title']}**\n{r['snippet']}\nSource: {r['url']}"
                for r in results
            ])
            
            return NodeResult(
                success=True,
                output={'results': formatted},
                metadata={'results_count': len(results)}
            )
        except Exception as e:
            return NodeResult(
                success=False,
                output=None,
                error=str(e)
            )


class ConditionalNodeProcessor(BaseNodeProcessor):
    """Process Conditional routing nodes"""
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        input_value = self.get_input(context, 'input')
        condition = node_data.get('condition', 'true')
        
        try:
            # Safe evaluation of condition
            # In production, use a proper expression parser
            result = eval(condition, {
                'input': input_value,
                'len': len,
                'str': str,
                'int': int,
                'float': float
            })
            
            return NodeResult(
                success=True,
                output={
                    'result': bool(result),
                    'branch': 'true' if result else 'false',
                    'value': input_value
                },
                metadata={'condition': condition}
            )
        except Exception as e:
            return NodeResult(
                success=False,
                output=None,
                error=f"Condition evaluation failed: {str(e)}"
            )


class TransformNodeProcessor(BaseNodeProcessor):
    """Process Transform nodes"""
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        input_value = self.get_input(context, 'input')
        transform_type = node_data.get('transformType', 'template')
        
        try:
            if transform_type == 'template':
                template = node_data.get('template', '{input}')
                output = template.replace('{input}', str(input_value))
                
            elif transform_type == 'json':
                import json
                output = json.loads(input_value)
                
            elif transform_type == 'extract':
                import json
                json_path = node_data.get('jsonPath', '')
                data = json.loads(input_value) if isinstance(input_value, str) else input_value
                # Simple path extraction (for complex paths, use jsonpath-ng)
                for key in json_path.split('.'):
                    data = data[key]
                output = data
                
            elif transform_type == 'uppercase':
                output = str(input_value).upper()
                
            elif transform_type == 'lowercase':
                output = str(input_value).lower()
                
            elif transform_type == 'trim':
                output = str(input_value).strip()
                
            else:
                output = input_value
            
            return NodeResult(
                success=True,
                output={'output': output},
                metadata={'transform_type': transform_type}
            )
        except Exception as e:
            return NodeResult(
                success=False,
                output=None,
                error=str(e)
            )


class OutputNodeProcessor(BaseNodeProcessor):
    """Process Output nodes"""
    
    async def process(self, node_data: Dict, context: Dict) -> NodeResult:
        output = self.get_input(context, 'output') or context.get('output', '')
        format_type = node_data.get('format', 'text')
        
        return NodeResult(
            success=True,
            output={'final_output': output, 'format': format_type},
            metadata={'output_length': len(str(output))}
        )
7. Workflow Executor Design
7.1 Execution Engine
python
# backend/app/services/workflow_executor.py

import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import structlog
from collections import defaultdict

logger = structlog.get_logger()


class NodeStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class ExecutionContext:
    """Holds the execution state and data flow"""
    user_query: str
    node_outputs: Dict[str, Any] = field(default_factory=dict)
    node_statuses: Dict[str, NodeStatus] = field(default_factory=dict)
    execution_log: List[Dict] = field(default_factory=list)
    errors: List[Dict] = field(default_factory=list)


@dataclass
class WorkflowDefinition:
    """Parsed workflow definition"""
    nodes: List[Dict]
    edges: List[Dict]
    node_map: Dict[str, Dict] = field(default_factory=dict)
    adjacency: Dict[str, List[str]] = field(default_factory=dict)
    reverse_adjacency: Dict[str, List[str]] = field(default_factory=dict)
    handle_connections: Dict[str, Dict[str, str]] = field(default_factory=dict)


class WorkflowExecutor:
    """
    Executes workflow definitions by:
    1. Parsing nodes and edges into a DAG
    2. Determining execution order (topological sort)
    3. Executing nodes in order, passing data through connections
    4. Handling conditional routing
    """
    
    def __init__(
        self,
        llm_service,
        embedding_service,
        vector_store,
        web_search_service
    ):
        self.llm_service = llm_service
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.web_search_service = web_search_service
        
        # Initialize node processors
        self.processors = {
            'input': InputNodeProcessor(),
            'llm': LLMNodeProcessor(llm_service),
            'knowledge': KnowledgeBaseNodeProcessor(embedding_service, vector_store),
            'webSearch': WebSearchNodeProcessor(web_search_service),
            'output': OutputNodeProcessor(),
            'conditional': ConditionalNodeProcessor(),
            'transform': TransformNodeProcessor(),
            'api': APINodeProcessor(),
            'memory': MemoryNodeProcessor(),
            'validator': ValidatorNodeProcessor(),
        }
    
    async def execute(
        self,
        definition: Dict,
        query: str,
        web_search: bool = False
    ) -> Dict[str, Any]:
        """
        Execute a workflow definition with the given query.
        
        Args:
            definition: Workflow definition with nodes and edges
            query: User's input query
            web_search: Whether to enable web search
            
        Returns:
            Execution result with answer and metadata
        """
        logger.info("workflow_execution_started", query_length=len(query))
        
        # Parse workflow
        workflow = self._parse_definition(definition)
        
        # Validate workflow
        validation = self._validate_workflow(workflow)
        if not validation['valid']:
            return {
                'success': False,
                'error': validation['errors'],
                'answer': None
            }
        
        # Initialize execution context
        context = ExecutionContext(user_query=query)
        context.node_outputs['user_query'] = query
        
        # Get execution order
        execution_order = self._topological_sort(workflow)
        
        logger.info("execution_order_determined", 
                   nodes=len(execution_order))
        
        # Execute nodes in order
        final_output = None
        
        for node_id in execution_order:
            node = workflow.node_map[node_id]
            node_type = node.get('type', 'unknown')
            
            # Check if node should be skipped (conditional routing)
            if context.node_statuses.get(node_id) == NodeStatus.SKIPPED:
                logger.info("node_skipped", node_id=node_id)
                continue
            
            context.node_statuses[node_id] = NodeStatus.RUNNING
            
            try:
                # Get inputs for this node from connected nodes
                node_context = self._gather_node_inputs(
                    node_id, workflow, context
                )
                
                # Get processor for node type
                processor = self.processors.get(node_type)
                if not processor:
                    raise ValueError(f"Unknown node type: {node_type}")
                
                # Execute node
                logger.info("executing_node", 
                           node_id=node_id, 
                           node_type=node_type)
                
                result = await processor.process(node['data'], node_context)
                
                if result.success:
                    context.node_outputs[node_id] = result.output
                    context.node_statuses[node_id] = NodeStatus.COMPLETED
                    
                    # Handle conditional routing
                    if node_type == 'conditional':
                        self._handle_conditional_routing(
                            node_id, result, workflow, context
                        )
                    
                    # Track output node result
                    if node_type == 'output':
                        final_output = result.output.get('final_output')
                    
                    # Log execution
                    context.execution_log.append({
                        'node_id': node_id,
                        'node_type': node_type,
                        'status': 'completed',
                        'metadata': result.message_metadata
                    })
                else:
                    context.node_statuses[node_id] = NodeStatus.FAILED
                    context.errors.append({
                        'node_id': node_id,
                        'error': result.error
                    })
                    
                    logger.error("node_execution_failed",
                               node_id=node_id,
                               error=result.error)
                    
            except Exception as e:
                context.node_statuses[node_id] = NodeStatus.FAILED
                context.errors.append({
                    'node_id': node_id,
                    'error': str(e)
                })
                logger.exception("node_execution_error", node_id=node_id)
        
        # Prepare result
        if context.errors:
            return {
                'success': False,
                'answer': final_output,
                'errors': context.errors,
                'execution_log': context.execution_log
            }
        
        return {
            'success': True,
            'answer': final_output or "No output generated",
            'execution_log': context.execution_log
        }
    
    def _parse_definition(self, definition: Dict) -> WorkflowDefinition:
        """Parse raw definition into structured workflow"""
        nodes = definition.get('nodes', [])
        edges = definition.get('edges', [])
        
        workflow = WorkflowDefinition(
            nodes=nodes,
            edges=edges
        )
        
        # Build node map
        for node in nodes:
            workflow.node_map[node['id']] = node
        
        # Build adjacency lists and handle connections
        for edge in edges:
            source = edge['source']
            target = edge['target']
            source_handle = edge.get('sourceHandle', 'output')
            target_handle = edge.get('targetHandle', 'input')
            
            # Forward adjacency (for execution order)
            if source not in workflow.adjacency:
                workflow.adjacency[source] = []
            workflow.adjacency[source].append(target)
            
            # Reverse adjacency (for input gathering)
            if target not in workflow.reverse_adjacency:
                workflow.reverse_adjacency[target] = []
            workflow.reverse_adjacency[target].append(source)
            
            # Handle connections (source_node:handle -> target_node:handle)
            connection_key = f"{target}:{target_handle}"
            workflow.handle_connections[connection_key] = {
                'source_node': source,
                'source_handle': source_handle
            }
        
        return workflow
    
    def _validate_workflow(self, workflow: WorkflowDefinition) -> Dict:
        """Validate workflow structure"""
        errors = []
        
        # Check for at least one input and output node
        node_types = [n.get('type') for n in workflow.nodes]
        
        if 'input' not in node_types:
            errors.append("Workflow must have at least one Input node")
        
        if 'output' not in node_types:
            errors.append("Workflow must have at least one Output node")
        
        # Check for cycles (would cause infinite execution)
        if self._has_cycle(workflow):
            errors.append("Workflow contains a cycle")
        
        # Check for disconnected nodes
        connected = set()
        for edge in workflow.edges:
            connected.add(edge['source'])
            connected.add(edge['target'])
        
        all_nodes = set(workflow.node_map.keys())
        disconnected = all_nodes - connected
        
        # Input nodes can be disconnected (they're entry points)
        for node_id in disconnected:
            node_type = workflow.node_map[node_id].get('type')
            if node_type != 'input':
                errors.append(f"Node {node_id} is disconnected")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _has_cycle(self, workflow: WorkflowDefinition) -> bool:
        """Detect cycles using DFS"""
        visited = set()
        rec_stack = set()
        
        def dfs(node_id):
            visited.add(node_id)
            rec_stack.add(node_id)
            
            for neighbor in workflow.adjacency.get(node_id, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node_id)
            return False
        
        for node_id in workflow.node_map:
            if node_id not in visited:
                if dfs(node_id):
                    return True
        
        return False
    
    def _topological_sort(self, workflow: WorkflowDefinition) -> List[str]:
        """
        Topological sort to determine execution order.
        Uses Kahn's algorithm.
        """
        # Calculate in-degrees
        in_degree = defaultdict(int)
        for node_id in workflow.node_map:
            in_degree[node_id] = 0
        
        for edges in workflow.adjacency.values():
            for target in edges:
                in_degree[target] += 1
        
        # Start with nodes that have no dependencies
        queue = [
            node_id for node_id, degree in in_degree.items()
            if degree == 0
        ]
        
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            for neighbor in workflow.adjacency.get(node_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result
    
    def _gather_node_inputs(
        self,
        node_id: str,
        workflow: WorkflowDefinition,
        context: ExecutionContext
    ) -> Dict[str, Any]:
        """Gather all inputs for a node from its connections"""
        inputs = {
            'user_query': context.user_query,
            'query': context.user_query  # Default query
        }
        
        # Find all incoming connections to this node
        for connection_key, connection in workflow.handle_connections.items():
            if connection_key.startswith(f"{node_id}:"):
                target_handle = connection_key.split(':')[1]
                source_node = connection['source_node']
                source_handle = connection['source_handle']
                
                # Get output from source node
                source_output = context.node_outputs.get(source_node, {})
                
                if isinstance(source_output, dict):
                    # Map source handle to value
                    value = source_output.get(source_handle) or \
                            source_output.get('output') or \
                            source_output.get('query') or \
                            source_output.get('context')
                else:
                    value = source_output
                
                inputs[target_handle] = value
        
        return inputs
    
    def _handle_conditional_routing(
        self,
        node_id: str,
        result: NodeResult,
        workflow: WorkflowDefinition,
        context: ExecutionContext
    ):
        """Handle conditional node routing by marking branches to skip"""
        branch = result.output.get('branch', 'true')
        
        # Find outgoing edges from this conditional node
        for edge in workflow.edges:
            if edge['source'] == node_id:
                source_handle = edge.get('sourceHandle', 'true')
                target_node = edge['target']
                
                # Skip nodes on the non-taken branch
                if source_handle != branch:
                    self._mark_branch_skipped(
                        target_node, workflow, context
                    )
    
    def _mark_branch_skipped(
        self,
        node_id: str,
        workflow: WorkflowDefinition,
        context: ExecutionContext
    ):
        """Recursively mark a branch as skipped"""
        context.node_statuses[node_id] = NodeStatus.SKIPPED
        
        for neighbor in workflow.adjacency.get(node_id, []):
            if context.node_statuses.get(neighbor) != NodeStatus.SKIPPED:
                self._mark_branch_skipped(neighbor, workflow, context)
8. Error Handling Strategy
8.1 Error Types & Hierarchy
python
# backend/app/core/exceptions.py

from typing import Optional, Dict, Any


class AskYiaException(Exception):
    """Base exception for AskYia application"""
    
    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict:
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details
        }


# Authentication Errors
class AuthenticationError(AskYiaException):
    """Authentication related errors"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, code="AUTH_ERROR")


class InvalidCredentialsError(AuthenticationError):
    """Invalid login credentials"""
    
    def __init__(self):
        super().__init__("Invalid email or password")
        self.code = "INVALID_CREDENTIALS"


class TokenExpiredError(AuthenticationError):
    """JWT token has expired"""
    
    def __init__(self):
        super().__init__("Token has expired")
        self.code = "TOKEN_EXPIRED"


class TokenInvalidError(AuthenticationError):
    """JWT token is invalid"""
    
    def __init__(self):
        super().__init__("Invalid token")
        self.code = "TOKEN_INVALID"


# Authorization Errors
class AuthorizationError(AskYiaException):
    """Authorization related errors"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, code="AUTHORIZATION_ERROR")


class ResourceNotFoundError(AskYiaException):
    """Requested resource not found"""
    
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            f"{resource} with id '{resource_id}' not found",
            code="NOT_FOUND",
            details={"resource": resource, "id": resource_id}
        )


# Validation Errors
class ValidationError(AskYiaException):
    """Input validation errors"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message,
            code="VALIDATION_ERROR",
            details={"field": field} if field else {}
        )


# Workflow Errors
class WorkflowError(AskYiaException):
    """Workflow execution errors"""
    pass


class WorkflowValidationError(WorkflowError):
    """Workflow definition is invalid"""
    
    def __init__(self, errors: list):
        super().__init__(
            "Workflow validation failed",
            code="WORKFLOW_INVALID",
            details={"errors": errors}
        )


class WorkflowExecutionError(WorkflowError):
    """Error during workflow execution"""
    
    def __init__(self, node_id: str, message: str):
        super().__init__(
            f"Execution failed at node {node_id}: {message}",
            code="WORKFLOW_EXECUTION_ERROR",
            details={"node_id": node_id}
        )


# External Service Errors
class ExternalServiceError(AskYiaException):
    """Errors from external services"""
    pass


class LLMServiceError(ExternalServiceError):
    """LLM API errors"""
    
    def __init__(self, provider: str, message: str):
        super().__init__(
            f"LLM service error ({provider}): {message}",
            code="LLM_SERVICE_ERROR",
            details={"provider": provider}
        )


class EmbeddingServiceError(ExternalServiceError):
    """Embedding service errors"""
    
    def __init__(self, message: str):
        super().__init__(
            f"Embedding service error: {message}",
            code="EMBEDDING_ERROR"
        )


class VectorStoreError(ExternalServiceError):
    """Vector database errors"""
    
    def __init__(self, message: str):
        super().__init__(
            f"Vector store error: {message}",
            code="VECTOR_STORE_ERROR"
        )


class WebSearchError(ExternalServiceError):
    """Web search API errors"""
    
    def __init__(self, message: str):
        super().__init__(
            f"Web search error: {message}",
            code="WEB_SEARCH_ERROR"
        )


# Rate Limiting
class RateLimitError(AskYiaException):
    """Rate limit exceeded"""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            "Rate limit exceeded. Please try again later.",
            code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after}
        )
8.2 Error Handler Middleware
python
# backend/app/core/error_handlers.py

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import structlog

from app.core.exceptions import (
    AskYiaException,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    RateLimitError
)

logger = structlog.get_logger()


async def askyia_exception_handler(
    request: Request,
    exc: AskYiaException
) -> JSONResponse:
    """Handle custom AskYia exceptions"""
    
    logger.warning(
        "application_error",
        error_code=exc.code,
        message=exc.message,
        path=request.url.path
    )
    
    # Map exception types to HTTP status codes
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    if isinstance(exc, AuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(exc, AuthorizationError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(exc, ResourceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, RateLimitError):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    
    return JSONResponse(
        status_code=status_code,
        content=exc.to_dict()
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors"""
    
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        "validation_error",
        errors=errors,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": {"errors": errors}
        }
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions"""
    
    logger.exception(
        "unexpected_error",
        error=str(exc),
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "details": {}
        }
    )


# Register handlers in main.py
def register_exception_handlers(app):
    app.add_exception_handler(AskYiaException, askyia_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
9. Caching Strategy
9.1 Cache Layers
python
# backend/app/core/cache.py

from typing import Optional, Any, Callable
from functools import wraps
import hashlib
import json
import time
from abc import ABC, abstractmethod
import structlog

logger = structlog.get_logger()


class CacheBackend(ABC):
    """Abstract cache backend"""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> None:
        pass
    
    @abstractmethod
    async def clear(self) -> None:
        pass


class InMemoryCache(CacheBackend):
    """Simple in-memory cache for development"""
    
    def __init__(self):
        self._cache: dict = {}
        self._expiry: dict = {}
    
    async def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            if self._expiry[key] > time.time():
                return self._cache[key]
            else:
                await self.delete(key)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        self._cache[key] = value
        self._expiry[key] = time.time() + ttl
    
    async def delete(self, key: str) -> None:
        self._cache.pop(key, None)
        self._expiry.pop(key, None)
    
    async def clear(self) -> None:
        self._cache.clear()
        self._expiry.clear()


class RedisCache(CacheBackend):
    """Redis cache backend for production"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        await self.redis.setex(key, ttl, json.dumps(value))
    
    async def delete(self, key: str) -> None:
        await self.redis.delete(key)
    
    async def clear(self) -> None:
        await self.redis.flushdb()


class CacheService:
    """
    Caching service with multiple cache strategies:
    - LLM response caching
    - Embedding caching
    - Query result caching
    """
    
    def __init__(self, backend: CacheBackend):
        self.backend = backend
        self.prefix = "askyia"
    
    def _make_key(self, namespace: str, *args) -> str:
        """Generate cache key from namespace and arguments"""
        key_data = json.dumps(args, sort_keys=True)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{self.prefix}:{namespace}:{key_hash}"
    
    async def get_llm_response(
        self,
        prompt: str,
        model: str,
        temperature: float
    ) -> Optional[str]:
        """Get cached LLM response"""
        key = self._make_key("llm", prompt, model, temperature)
        return await self.backend.get(key)
    
    async def set_llm_response(
        self,
        prompt: str,
        model: str,
        temperature: float,
        response: str,
        ttl: int = 3600
    ) -> None:
        """Cache LLM response"""
        key = self._make_key("llm", prompt, model, temperature)
        await self.backend.set(key, response, ttl)
    
    async def get_embedding(self, text: str, model: str) -> Optional[list]:
        """Get cached embedding"""
        key = self._make_key("embedding", text, model)
        return await self.backend.get(key)
    
    async def set_embedding(
        self,
        text: str,
        model: str,
        embedding: list,
        ttl: int = 86400  # 24 hours
    ) -> None:
        """Cache embedding"""
        key = self._make_key("embedding", text, model)
        await self.backend.set(key, embedding, ttl)
    
    async def get_search_results(
        self,
        query: str,
        collection: str,
        top_k: int
    ) -> Optional[list]:
        """Get cached search results"""
        key = self._make_key("search", query, collection, top_k)
        return await self.backend.get(key)
    
    async def set_search_results(
        self,
        query: str,
        collection: str,
        top_k: int,
        results: list,
        ttl: int = 300  # 5 minutes
    ) -> None:
        """Cache search results"""
        key = self._make_key("search", query, collection, top_k)
        await self.backend.set(key, results, ttl)


def cached(
    cache_service: CacheService,
    namespace: str,
    ttl: int = 3600,
    key_builder: Optional[Callable] = None
):
    """
    Decorator for caching function results
    
    Usage:
        @cached(cache_service, "my_function", ttl=600)
        async def my_function(arg1, arg2):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                cache_key = cache_service._make_key(
                    namespace, 
                    str(args), 
                    str(sorted(kwargs.items()))
                )
            
            # Try to get from cache
            cached_result = await cache_service.backend.get(cache_key)
            if cached_result is not None:
                logger.debug("cache_hit", namespace=namespace)
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_service.backend.set(cache_key, result, ttl)
            logger.debug("cache_miss", namespace=namespace)
            
            return result
        return wrapper
    return decorator
10. Testing Strategy
10.1 Test Structure
text
tests/
├── unit/
│   ├── test_node_processors.py
│   ├── test_workflow_executor.py
│   ├── test_llm_service.py
│   ├── test_embedding_service.py
│   └── test_validators.py
├── integration/
│   ├── test_api_auth.py
│   ├── test_api_stacks.py
│   ├── test_api_workflows.py
│   ├── test_api_chat.py
│   └── test_database.py
├── e2e/
│   ├── test_full_workflow.py
│   ├── test_chat_session.py
│   └── test_document_upload.py
├── fixtures/
│   ├── users.py
│   ├── stacks.py
│   ├── workflows.py
│   └── documents.py
├── conftest.py
└── pytest.ini
10.2 Test Examples
python
# tests/unit/test_workflow_executor.py

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.workflow_executor import (
    WorkflowExecutor,
    ExecutionContext,
    NodeStatus
)


@pytest.fixture
def mock_services():
    return {
        'llm_service': AsyncMock(),
        'embedding_service': AsyncMock(),
        'vector_store': AsyncMock(),
        'web_search_service': AsyncMock()
    }


@pytest.fixture
def executor(mock_services):
    return WorkflowExecutor(**mock_services)


@pytest.fixture
def simple_workflow():
    return {
        'nodes': [
            {'id': 'input-1', 'type': 'input', 'data': {'query': ''}},
            {'id': 'llm-1', 'type': 'llm', 'data': {'model': 'gemini-2.0-flash'}},
            {'id': 'output-1', 'type': 'output', 'data': {}}
        ],
        'edges': [
            {'id': 'e1', 'source': 'input-1', 'target': 'llm-1', 
             'sourceHandle': 'query', 'targetHandle': 'query'},
            {'id': 'e2', 'source': 'llm-1', 'target': 'output-1',
             'sourceHandle': 'output', 'targetHandle': 'output'}
        ]
    }


class TestWorkflowExecutor:
    
    @pytest.mark.asyncio
    async def test_execute_simple_workflow(self, executor, simple_workflow, mock_services):
        # Arrange
        mock_services['llm_service'].generate.return_value = "Hello! How can I help?"
        
        # Act
        result = await executor.execute(simple_workflow, "Hello")
        
        # Assert
        assert result['success'] is True
        assert result['answer'] is not None
        mock_services['llm_service'].generate.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_execute_with_knowledge_base(self, executor, mock_services):
        # Arrange
        workflow = {
            'nodes': [
                {'id': 'input-1', 'type': 'input', 'data': {}},
                {'id': 'kb-1', 'type': 'knowledge', 'data': {'topK': 3}},
                {'id': 'llm-1', 'type': 'llm', 'data': {}},
                {'id': 'output-1', 'type': 'output', 'data': {}}
            ],
            'edges': [
                {'id': 'e1', 'source': 'input-1', 'target': 'kb-1'},
                {'id': 'e2', 'source': 'input-1', 'target': 'llm-1'},
                {'id': 'e3', 'source': 'kb-1', 'target': 'llm-1'},
                {'id': 'e4', 'source': 'llm-1', 'target': 'output-1'}
            ]
        }
        
        mock_services['embedding_service'].embed_text.return_value = [0.1] * 768
        mock_services['vector_store'].search.return_value = [
            {'content': 'Relevant context', 'score': 0.9}
        ]
        mock_services['llm_service'].generate.return_value = "Based on the context..."
        
        # Act
        result = await executor.execute(workflow, "What is X?")
        
        # Assert
        assert result['success'] is True
        mock_services['vector_store'].search.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_workflow_validation_no_input_node(self, executor):
        # Arrange
        invalid_workflow = {
            'nodes': [
                {'id': 'llm-1', 'type': 'llm', 'data': {}},
                {'id': 'output-1', 'type': 'output', 'data': {}}
            ],
            'edges': []
        }
        
        # Act
        result = await executor.execute(invalid_workflow, "Hello")
        
        # Assert
        assert result['success'] is False
        assert 'Input node' in str(result['error'])
    
    @pytest.mark.asyncio
    async def test_conditional_routing(self, executor, mock_services):
        # Arrange
        workflow = {
            'nodes': [
                {'id': 'input-1', 'type': 'input', 'data': {}},
                {'id': 'cond-1', 'type': 'conditional', 
                 'data': {'condition': 'len(input) > 10'}},
                {'id': 'llm-true', 'type': 'llm', 'data': {}},
                {'id': 'llm-false', 'type': 'llm', 'data': {}},
                {'id': 'output-1', 'type': 'output', 'data': {}}
            ],
            'edges': [
                {'id': 'e1', 'source': 'input-1', 'target': 'cond-1',
                 'sourceHandle': 'query', 'targetHandle': 'input'},
                {'id': 'e2', 'source': 'cond-1', 'target': 'llm-true',
                 'sourceHandle': 'true'},
                {'id': 'e3', 'source': 'cond-1', 'target': 'llm-false',
                 'sourceHandle': 'false'},
            ]
        }
        
        mock_services['llm_service'].generate.return_value = "Response"
        
        # Act - Short input (< 10 chars)
        result = await executor.execute(workflow, "Hi")
        
        # Assert - Should take false branch
        # llm-true should be skipped
        assert result['success'] is True


# tests/integration/test_api_chat.py

import pytest
from httpx import AsyncClient
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client):
    # Login and get token
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@askyia.com",
        "password": "test123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestChatAPI:
    
    @pytest.mark.asyncio
    async def test_chat_ask_simple(self, client, auth_headers):
        # Arrange
        payload = {
            "query": "Hello, how are you?",
            "workflow_definition": {
                "nodes": [
                    {"id": "1", "type": "input", "data": {}},
                    {"id": "2", "type": "llm", "data": {"model": "gemini-2.0-flash"}},
                    {"id": "3", "type": "output", "data": {}}
                ],
                "edges": [
                    {"id": "e1", "source": "1", "target": "2"},
                    {"id": "e2", "source": "2", "target": "3"}
                ]
            }
        }
        
        # Act
        response = await client.post(
            "/api/v1/chat/ask",
            json=payload,
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 0
    
    @pytest.mark.asyncio
    async def test_chat_ask_unauthorized(self, client):
        # Act
        response = await client.post("/api/v1/chat/ask", json={
            "query": "Hello",
            "workflow_definition": {"nodes": [], "edges": []}
        })
        
        # Assert
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_chat_ask_invalid_workflow(self, client, auth_headers):
        # Arrange - Missing output node
        payload = {
            "query": "Hello",
            "workflow_definition": {
                "nodes": [
                    {"id": "1", "type": "input", "data": {}}
                ],
                "edges": []
            }
        }
        
        # Act
        response = await client.post(
            "/api/v1/chat/ask",
            json=payload,
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code in [400, 422]
11. Deployment Configuration
11.1 Docker Compose (Production)
yaml
# docker-compose.prod.yml

version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - frontend_build:/usr/share/nginx/html
    depends_on:
      - frontend
      - backend
    networks:
      - askyia-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    volumes:
      - frontend_build:/app/dist
    environment:
      - VITE_API_BASE_URL=/api
    networks:
      - askyia-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://askyia:${DB_PASSWORD}@postgres:5432/askyia
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SERPAPI_KEY=${SERPAPI_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - CHROMA_HOST=chromadb
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=production
    depends_on:
      - postgres
      - chromadb
      - redis
    networks:
      - askyia-network
    restart: always
    deploy:
      replicas: 2

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=askyia
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=askyia
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - askyia-network
    restart: always

  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - ANONYMIZED_TELEMETRY=False
    networks:
      - askyia-network
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - askyia-network
    restart: always

volumes:
  frontend_build:
  postgres_data:
  chroma_data:
  redis_data:

networks:
  askyia-network:
    driver: bridge
11.2 Nginx Configuration
nginx
# nginx/nginx.conf

worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=chat:10m rate=2r/s;

    # Upstream backends
    upstream backend {
        least_conn;
        server backend:8000;
    }

    server {
        listen 80;
        server_name _;

        # Redirect HTTP to HTTPS in production
        # return 301 https://$server_name$request_uri;

        root /usr/share/nginx/html;
        index index.html;

        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
        }

        # Chat endpoint with stricter rate limiting
        location /api/v1/chat/ {
            limit_req zone=chat burst=5 nodelay;
            
            proxy_pass http://backend/api/v1/chat/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 120s;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

AskYia/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── nodes/
│ │ │ │ ├── InputNode.tsx
│ │ │ │ ├── LLMNode.tsx
│ │ │ │ ├── KnowledgeBaseNode.tsx
│ │ │ │ ├── WebSearchNode.tsx
│ │ │ │ ├── OutputNode.tsx
│ │ │ │ ├── ConditionalNode.tsx
│ │ │ │ ├── TransformNode.tsx
│ │ │ │ ├── APINode.tsx
│ │ │ │ ├── MemoryNode.tsx
│ │ │ │ ├── ValidatorNode.tsx
│ │ │ │ └── index.ts
│ │ │ ├── common/
│ │ │ │ ├── Logo.tsx
│ │ │ │ ├── UserMenu.tsx
│ │ │ │ ├── Modal.tsx
│ │ │ │ ├── Tooltip.tsx
│ │ │ │ ├── Button.tsx
│ │ │ │ ├── Loading.tsx
│ │ │ │ ├── CreateStackModal.tsx
│ │ │ │ ├── EditStackModal.tsx
│ │ │ │ ├── SaveWorkflowModal.tsx
│ │ │ │ └── ImportConfigModal.tsx
│ │ │ ├── chat/
│ │ │ │ ├── ChatModal.tsx
│ │ │ │ ├── ChatInput.tsx
│ │ │ │ ├── ChatMessage.tsx
│ │ │ │ └── ChatInterface.tsx
│ │ │ ├── panels/
│ │ │ │ ├── ComponentLibrary.tsx
│ │ │ │ ├── ConfigurationPanel.tsx
│ │ │ │ ├── ExecutionControls.tsx
│ │ │ │ └── WorkspacePanel.tsx
│ │ │ └── auth/
│ │ │ ├── LoginForm.tsx
│ │ │ └── RegisterForm.tsx
│ │ ├── pages/
│ │ │ ├── Login.tsx
│ │ │ ├── Dashboard.tsx
│ │ │ └── WorkflowBuilder.tsx
│ │ ├── store/
│ │ │ ├── authSlice.ts
│ │ │ ├── stackSlice.ts
│ │ │ ├── workflowSlice.ts
│ │ │ ├── chatSlice.ts
│ │ │ └── index.ts
│ │ ├── services/
│ │ │ ├── api.ts
│ │ │ ├── authService.ts
│ │ │ ├── chatService.ts
│ │ │ ├── documentService.ts
│ │ │ └── workflowService.ts
│ │ ├── hooks/
│ │ │ ├── useAuth.ts
│ │ │ ├── useChat.ts
│ │ │ ├── useWorkflow.ts
│ │ │ └── useWebSocket.ts
│ │ ├── types/
│ │ │ ├── node.types.ts
│ │ │ ├── chat.types.ts
│ │ │ └── workflow.types.ts
│ │ ├── styles/
│ │ │ ├── index.css
│ │ │ ├── Nodes.css
│ │ │ ├── WorkflowBuilder.css
│ │ │ ├── Dashboard.css
│ │ │ ├── Modal.css
│ │ │ ├── Chat.css
│ │ │ ├── Login.css
│ │ │ ├── LoginForm.css
│ │ │ ├── Logo.css
│ │ │ └── Tooltip.css
│ │ ├── utils/
│ │ │ ├── constants.ts
│ │ │ ├── helpers.ts
│ │ │ └── validators.ts
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── index.css
│ ├── public/
│ │ ├── favicon.ico
│ │ └── assets/
│ ├── index.html
│ ├── package.json
│ ├── package-lock.json
│ ├── tsconfig.json
│ ├── tsconfig.node.json
│ ├── vite.config.ts
│ ├── .env
│ ├── .env.example
│ ├── .eslintrc.json
│ ├── .gitignore
│ ├── Dockerfile
│ ├── Dockerfile.prod
│ ├── README.md
│ ├── QUICKSTART.md
│ └── SAMPLE_WORKFLOWS.md
│
├── backend/
│ ├── app/
│ │ ├── api/
│ │ │ └── v1/
│ │ │ ├── endpoints/
│ │ │ │ ├── auth.py
│ │ │ │ ├── users.py
│ │ │ │ ├── stacks.py
│ │ │ │ ├── workflows.py
│ │ │ │ ├── chat.py
│ │ │ │ ├── documents.py
│ │ │ │ └── health.py
│ │ │ ├── dependencies.py
│ │ │ └── router.py
│ │ ├── core/
│ │ │ ├── init.py
│ │ │ ├── config.py
│ │ │ ├── security.py
│ │ │ ├── exceptions.py
│ │ │ ├── error_handlers.py
│ │ │ ├── cache.py
│ │ │ └── logging.py
│ │ ├── models/
│ │ │ ├── init.py
│ │ │ ├── base.py
│ │ │ ├── user.py
│ │ │ ├── stack.py
│ │ │ ├── workflow.py
│ │ │ ├── document.py
│ │ │ ├── chat_session.py
│ │ │ └── execution_log.py
│ │ ├── schemas/
│ │ │ ├── init.py
│ │ │ ├── user.py
│ │ │ ├── stack.py
│ │ │ ├── workflow.py
│ │ │ ├── chat.py
│ │ │ ├── document.py
│ │ │ └── common.py
│ │ ├── services/
│ │ │ ├── init.py
│ │ │ ├── llm/
│ │ │ │ ├── init.py
│ │ │ │ ├── base.py
│ │ │ │ ├── gemini_client.py
│ │ │ │ ├── openai_client.py
│ │ │ │ └── factory.py
│ │ │ ├── embedding/
│ │ │ │ ├── init.py
│ │ │ │ ├── base.py
│ │ │ │ ├── gemini_embedding.py
│ │ │ │ └── openai_embedding.py
│ │ │ ├── vector_store/
│ │ │ │ ├── init.py
│ │ │ │ ├── base.py
│ │ │ │ └── chroma_store.py
│ │ │ ├── web_search/
│ │ │ │ ├── init.py
│ │ │ │ └── serpapi_client.py
│ │ │ ├── document_processor.py
│ │ │ ├── workflow_executor.py
│ │ │ ├── node_processors.py
│ │ │ └── auth_service.py
│ │ ├── repositories/
│ │ │ ├── init.py
│ │ │ ├── base.py
│ │ │ ├── user_repository.py
│ │ │ ├── stack_repository.py
│ │ │ ├── workflow_repository.py
│ │ │ └── document_repository.py
│ │ ├── db/
│ │ │ ├── init.py
│ │ │ ├── database.py
│ │ │ ├── session.py
│ │ │ ├── migrations/
│ │ │ │ ├── versions/
│ │ │ │ ├── env.py
│ │ │ │ └── script.py.mako
│ │ │ └── seed.py
│ │ ├── utils/
│ │ │ ├── init.py
│ │ │ ├── helpers.py
│ │ │ └── validators.py
│ │ └── main.py
│ ├── tests/
│ │ ├── init.py
│ │ ├── unit/
│ │ │ ├── init.py
│ │ │ ├── test_node_processors.py
│ │ │ ├── test_workflow_executor.py
│ │ │ ├── test_llm_service.py
│ │ │ ├── test_embedding_service.py
│ │ │ ├── test_document_processor.py
│ │ │ └── test_validators.py
│ │ ├── integration/
│ │ │ ├── init.py
│ │ │ ├── test_api_auth.py
│ │ │ ├── test_api_stacks.py
│ │ │ ├── test_api_workflows.py
│ │ │ ├── test_api_chat.py
│ │ │ ├── test_api_documents.py
│ │ │ └── test_database.py
│ │ ├── e2e/
│ │ │ ├── init.py
│ │ │ ├── test_full_workflow.py
│ │ │ ├── test_chat_session.py
│ │ │ └── test_document_upload.py
│ │ ├── fixtures/
│ │ │ ├── init.py
│ │ │ ├── users.py
│ │ │ ├── stacks.py
│ │ │ ├── workflows.py
│ │ │ └── documents.py
│ │ ├── conftest.py
│ │ └── pytest.ini
│ ├── alembic.ini
│ ├── requirements.txt
│ ├── requirements-dev.txt
│ ├── .env
│ ├── .env.example
│ ├── .gitignore
│ ├── Dockerfile
│ ├── Dockerfile.prod
│ ├── entrypoint.sh
│ └── README.md
│
├── docs/
│ ├── design/
│ │ ├── HLD.md
│ │ └── LLD.md
│ ├── api/
│ │ ├── openapi.yaml
│ │ └── postman_collection.json
│ ├── deployment/
│ │ ├── docker.md
│ │ ├── kubernetes.md
│ │ └── monitoring.md
│ ├── development/
│ │ ├── setup.md
│ │ ├── contributing.md
│ │ └── testing.md
│ └── user-guide/
│ ├── getting-started.md
│ ├── workflow-builder.md
│ └── nodes-reference.md
│
├── monitoring/
│ ├── prometheus/
│ │ ├── prometheus.yml
│ │ ├── alerts.yml
│ │ └── rules/
│ │ ├── api_alerts.yml
│ │ ├── database_alerts.yml
│ │ └── system_alerts.yml
│ ├── grafana/
│ │ ├── provisioning/
│ │ │ ├── datasources/
│ │ │ │ └── datasources.yml
│ │ │ └── dashboards/
│ │ │ └── dashboards.yml
│ │ └── dashboards/
│ │ ├── api-overview.json
│ │ ├── workflow-execution.json
│ │ ├── database-metrics.json
│ │ └── system-metrics.json
│ ├── logstash/
│ │ ├── config/
│ │ │ └── logstash.yml
│ │ └── pipeline/
│ │ └── logstash.conf
│ ├── alertmanager/
│ │ └── alertmanager.yml
│ └── README.md
│
├── kubernetes/
│ ├── base/
│ │ ├── namespace.yaml
│ │ ├── configmap.yaml
│ │ ├── secrets.yaml
│ │ ├── frontend/
│ │ │ ├── deployment.yaml
│ │ │ ├── service.yaml
│ │ │ └── hpa.yaml
│ │ ├── backend/
│ │ │ ├── deployment.yaml
│ │ │ ├── service.yaml
│ │ │ └── hpa.yaml
│ │ ├── postgres/
│ │ │ ├── statefulset.yaml
│ │ │ ├── service.yaml
│ │ │ └── pvc.yaml
│ │ ├── chromadb/
│ │ │ ├── deployment.yaml
│ │ │ ├── service.yaml
│ │ │ └── pvc.yaml
│ │ ├── redis/
│ │ │ ├── deployment.yaml
│ │ │ └── service.yaml
│ │ └── ingress.yaml
│ ├── overlays/
│ │ ├── development/
│ │ │ └── kustomization.yaml
│ │ ├── staging/
│ │ │ └── kustomization.yaml
│ │ └── production/
│ │ └── kustomization.yaml
│ └── README.md
│
├── scripts/
│ ├── setup.sh
│ ├── build.sh
│ ├── deploy.sh
│ ├── backup-db.sh
│ ├── restore-db.sh
│ ├── seed-db.sh
│ └── run-tests.sh
│
├── nginx/
│ ├── nginx.conf
│ ├── nginx.prod.conf
│ └── ssl/
│ └── .gitkeep
│
├── .github/
│ ├── workflows/
│ │ ├── ci.yml
│ │ ├── cd.yml
│ │ └── codeql.yml
│ ├── ISSUE_TEMPLATE/
│ │ ├── bug_report.md
│ │ └── feature_request.md
│ ├── PULL_REQUEST_TEMPLATE.md
│ └── dependabot.yml
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.monitoring.yml
├── docker-compose.test.yml
├── .env.example
├── .gitignore
├── .dockerignore
├── Makefile
├── LICENSE
└── README.md

text

---

## 13. Configuration Files

### 13.1 Environment Variables

```bash
# .env.example

# ===========================================
# Application Settings
# ===========================================
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# ===========================================
# Backend Settings
# ===========================================
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8001
API_V1_STR=/api/v1
PROJECT_NAME=AskYia

# ===========================================
# Frontend Settings
# ===========================================
VITE_API_BASE_URL=http://localhost:8001
VITE_API_V1_STR=/api/v1

# ===========================================
# Security
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ===========================================
# Database
# ===========================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=askyia
POSTGRES_PASSWORD=askyia123
POSTGRES_DB=askyia
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# ===========================================
# Vector Database (ChromaDB)
# ===========================================
CHROMA_HOST=chromadb
CHROMA_PORT=8000

# ===========================================
# Redis (Optional - for caching)
# ===========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}/0

# ===========================================
# AI/LLM APIs
# ===========================================
# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# OpenAI (Fallback)
OPENAI_API_KEY=your-openai-api-key

# Web Search (SerpAPI)
SERPAPI_KEY=your-serpapi-key

# ===========================================
# File Storage
# ===========================================
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes

# ===========================================
# Rate Limiting
# ===========================================
RATE_LIMIT_PER_MINUTE=60
CHAT_RATE_LIMIT_PER_MINUTE=20

# ===========================================
# Monitoring (Optional)
# ===========================================
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
13.2 Makefile
makefile
# Makefile

.PHONY: help build up down restart logs shell test lint format clean

# Default target
help:
	@echo "AskYia - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build         Build all Docker images"
	@echo "  up            Start all services"
	@echo "  down          Stop all services"
	@echo "  restart       Restart all services"
	@echo "  logs          View logs (use SERVICE=name for specific service)"
	@echo "  shell-backend Enter backend container shell"
	@echo "  shell-frontend Enter frontend container shell"
	@echo "  test          Run all tests"
	@echo "  test-backend  Run backend tests"
	@echo "  test-frontend Run frontend tests"
	@echo "  lint          Run linters"
	@echo "  format        Format code"
	@echo "  clean         Remove all containers and volumes"
	@echo "  db-migrate    Run database migrations"
	@echo "  db-seed       Seed database with test data"
	@echo "  monitoring-up Start monitoring stack"
	@echo ""

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart $(SERVICE)

logs:
ifdef SERVICE
	docker-compose logs -f $(SERVICE)
else
	docker-compose logs -f
endif

shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh

# Testing
test: test-backend test-frontend

test-backend:
	docker-compose exec backend pytest -v

test-frontend:
	docker-compose exec frontend npm test

test-coverage:
	docker-compose exec backend pytest --cov=app --cov-report=html
	@echo "Coverage report generated in backend/htmlcov/"

# Code quality
lint:
	docker-compose exec backend flake8 app/
	docker-compose exec backend mypy app/
	docker-compose exec frontend npm run lint

format:
	docker-compose exec backend black app/
	docker-compose exec backend isort app/
	docker-compose exec frontend npm run format

# Database
db-migrate:
	docker-compose exec backend alembic upgrade head

db-rollback:
	docker-compose exec backend alembic downgrade -1

db-seed:
	docker-compose exec backend python -m app.db.seed

db-reset:
	docker-compose exec backend alembic downgrade base
	docker-compose exec backend alembic upgrade head
	docker-compose exec backend python -m app.db.seed

# Monitoring
monitoring-up:
	docker-compose -f docker-compose.monitoring.yml up -d

monitoring-down:
	docker-compose -f docker-compose.monitoring.yml down

# Cleanup
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

clean-all:
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.monitoring.yml down -v
	docker system prune -af
	docker volume prune -f

# Production
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

# Utilities
check-health:
	@echo "Checking service health..."
	@curl -s http://localhost:8001/health | jq .
	@echo ""

backup-db:
	./scripts/backup-db.sh

restore-db:
	./scripts/restore-db.sh $(BACKUP_FILE)
13.3 GitHub Actions CI/CD
yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linting
        working-directory: ./backend
        run: |
          flake8 app/ --count --select=E9,F63,F7,F82 --show-source --statistics
          black --check app/

      - name: Run type checking
        working-directory: ./backend
        run: mypy app/ --ignore-missing-imports

      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          JWT_SECRET: test-secret
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: pytest -v --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linting
        working-directory: ./frontend
        run: npm run lint

      - name: Run type checking
        working-directory: ./frontend
        run: npm run type-check

      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage

      - name: Build
        working-directory: ./frontend
        run: npm run build

  # Build Docker Images
  build:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.prod
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
14. Appendix
14.1 Glossary
Term	Definition
DAG	Directed Acyclic Graph - workflow structure without cycles
RAG	Retrieval-Augmented Generation - combining retrieval with LLM
LLM	Large Language Model
Embedding	Vector representation of text
Vector Store	Database optimized for similarity search
Node	Individual component in a workflow
Edge	Connection between nodes
Handle	Connection point on a node
Stack	Collection of related workflows
Workflow	Complete flow definition with nodes and edges
14.2 API Error Codes
Code	HTTP Status	Description
AUTH_ERROR	401	Authentication failed
INVALID_CREDENTIALS	401	Wrong email/password
TOKEN_EXPIRED	401	JWT token expired
TOKEN_INVALID	401	JWT token invalid
AUTHORIZATION_ERROR	403	Access denied
NOT_FOUND	404	Resource not found
VALIDATION_ERROR	400/422	Input validation failed
WORKFLOW_INVALID	400	Workflow definition invalid
WORKFLOW_EXECUTION_ERROR	500	Workflow execution failed
LLM_SERVICE_ERROR	502	LLM API error
EMBEDDING_ERROR	502	Embedding service error
VECTOR_STORE_ERROR	502	Vector database error
WEB_SEARCH_ERROR	502	Web search API error
RATE_LIMIT_EXCEEDED	429	Too many requests
INTERNAL_ERROR	500	Unexpected server error
14.3 Node Handle Reference
Node Type	Input Handles	Output Handles
Input	-	query (orange)
LLM	context (blue), query (orange)	output (blue)
Knowledge Base	query (orange)	context (orange)
Web Search	query (orange)	results (green)
Output	output (green)	-
Conditional	input (purple)	true (green), false (orange)
Transform	input (blue)	output (blue)
API	body (purple)	response (green)
Memory	input (purple), query (orange)	history (blue)
Validator	input (blue)	valid (green), invalid (orange)
14.4 Performance Benchmarks (Target)
Operation	Target	Notes
API Response (no LLM)	< 100ms	Simple CRUD operations
API Response (with LLM)	< 5s	Including LLM generation
Document Upload (10MB)	< 30s	Including embedding
Vector Search	< 200ms	Top-k similarity search
Workflow Validation	< 50ms	DAG validation
Login/Auth	< 200ms	JWT generation
