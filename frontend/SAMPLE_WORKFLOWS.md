# 📚 Sample Workflows

Here are some example workflows you can build in the AskYiainterface:

## 1. Simple Chat Assistant

**Purpose**: Basic question-answering with LLM

**Nodes Required**: 3
- Input Node
- LLM Node  
- Output Node

**Connections**:
```
Input (query) → LLM (query)
LLM (output) → Output (output)
```

**Configuration**:
- LLM: GPT-4o-Mini, temperature 0.7
- Prompt: "You are a helpful assistant. Answer concisely.\n\nUser Query: {query}"

---

## 2. PDF Chat Assistant

**Purpose**: Chat with PDF documents using RAG

**Nodes Required**: 4
- Input Node
- Knowledge Base Node
- LLM Node
- Output Node

**Connections**:
```
Input (query) → Knowledge Base (query)
Input (query) → LLM (query)
Knowledge Base (context) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- Knowledge Base: Upload PDF, text-embedding-ada-002
- LLM: GPT-4o-Mini, temperature 0.75
- Prompt: "You are a PDF assistant. Use the context below.\n\nCONTEXT: {context}\nUser Query: {query}"

---

## 3. Web-Enhanced Chat

**Purpose**: LLM with web search capability

**Nodes Required**: 4
- Input Node
- Web Search Node
- LLM Node
- Output Node

**Connections**:
```
Input (query) → Web Search (query)
Input (query) → LLM (query)
Web Search (results) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- Web Search: SERP API key, max 5 results
- LLM: GPT-4, temperature 0.7, WebSearch ON
- Prompt: "Use web results below to answer.\n\nWEB INFO: {context}\nUser Query: {query}"

---

## 4. Document + Web Hybrid

**Purpose**: Answer from PDF first, fallback to web

**Nodes Required**: 5 (All nodes!)
- Input Node
- Knowledge Base Node
- Web Search Node
- LLM Node
- Output Node

**Connections**:
```
Input (query) → Knowledge Base (query)
Input (query) → Web Search (query)
Input (query) → LLM (query)
Knowledge Base (context) → LLM (context)
Web Search (results) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- Knowledge Base: Upload PDF documents
- Web Search: Enable for supplemental info
- LLM: GPT-4, temperature 0.75
- Prompt: "Use PDF context first, then web results if needed.\n\nPDF: {context}\nWEB: {web_results}\nQuery: {query}"

---

## 5. Content Summarizer

**Purpose**: Summarize uploaded documents

**Nodes Required**: 3
- Input Node
- Knowledge Base Node
- LLM Node
- Output Node

**Connections**:
```
Input (query) → Knowledge Base (query)
Knowledge Base (context) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- Knowledge Base: Upload document
- LLM: GPT-4o-Mini, temperature 0.3 (more focused)
- Input: "Summarize this document"
- Prompt: "Summarize the following:\n\n{context}"

---

## 6. Research Assistant

**Purpose**: Gather and synthesize web information

**Nodes Required**: 3
- Input Node
- Web Search Node
- LLM Node
- Output Node

**Connections**:
```
Input (query) → Web Search (query)
Web Search (results) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- Web Search: Max 10 results
- LLM: GPT-4, temperature 0.6
- Prompt: "Research the topic using web results:\n\n{context}\n\nProvide a comprehensive answer to: {query}"

---

## 7. Multi-Document Q&A

**Purpose**: Answer questions across multiple documents

**Nodes Required**: 4+
- Input Node
- Multiple Knowledge Base Nodes
- LLM Node
- Output Node

**Connections**:
```
Input (query) → KB1 (query)
Input (query) → KB2 (query)
Input (query) → LLM (query)
KB1 (context) → LLM (context)
KB2 (context) → LLM (context)
LLM (output) → Output (output)
```

**Configuration**:
- KB1: First set of documents
- KB2: Second set of documents
- LLM: Combine contexts from all sources

---

## 🎯 Tips for Building Workflows

### Connection Best Practices

1. **Query Flow** (🟠 Orange)
   - Always starts from Input node
   - Can branch to multiple nodes
   - Carries the user's question

2. **Context Flow** (🔵 Blue)
   - From Knowledge Base or Web Search
   - Goes into LLM
   - Contains retrieved information

3. **Output Flow** (🔵→🟢 Blue to Green)
   - From LLM to Output
   - Final result display

### Configuration Tips

1. **Temperature Settings**
   - 0.0-0.3: Factual, precise (summaries, data extraction)
   - 0.4-0.7: Balanced (Q&A, general chat)
   - 0.8-1.0: Creative (writing, brainstorming)

2. **Model Selection**
   - GPT-4: Complex reasoning, accuracy
   - GPT-4o-Mini: Fast, cost-effective
   - GPT-3.5-Turbo: Simple tasks

3. **Prompt Engineering**
   - Be specific about role and task
   - Use {context} and {query} placeholders
   - Include output format instructions

### Common Patterns

**Pattern 1: RAG (Retrieval-Augmented Generation)**
```
Input → Knowledge Base → LLM → Output
           ↓
         Context
```

**Pattern 2: Multi-Source**
```
Input → KB1 ↘
Input → KB2 → LLM → Output
Input → Web ↗
```

**Pattern 3: Sequential Processing**
```
Input → Node1 → Node2 → Node3 → Output
```

---

## 🚀 Try These Workflows

Copy these configurations into your AskYiainterface and customize them for your needs!

Each workflow can be saved as a separate "Stack" in the dashboard.

---

## 💡 Custom Workflow Ideas

Build your own for:
- Customer support chatbot
- Code documentation Q&A
- Legal document analysis
- Medical research assistant
- Educational tutor
- Content generator
- Data analyst
- Language translator
- Email responder
- Meeting summarizer

The possibilities are endless! 🎉
