# AskYiaFrontend

A modern, intuitive frontend for building and managing generative AI workflows with a drag-and-drop interface.

## 🎨 Features

### ✅ Completed Features

1. **Dashboard**
   - Empty state with "Create New Stack" prompt
   - Stack cards grid displaying all created stacks
   - Quick navigation to workflow builder

2. **Stack Management**
   - Create Stack Modal with name and description
   - Stack storage using Zustand
   - Edit/Open existing stacks

3. **Workflow Builder**
   - React Flow powered drag-and-drop canvas
   - Component library sidebar with 5 node types:
     - 📥 Input/User Query
     - ✨ LLM (OpenAI)
     - 📚 Knowledge Base
     - 🌐 Web Search
     - 📤 Output
   - Dotted canvas background
   - Visual connection handles with color coding

4. **Node Configuration**
   - **Inline configuration** (inside each node, not separate panel)
   - Expandable/collapsible nodes
   - Specific configurations per node type:
     - Input: Query text area
     - LLM: Model selection, API key, prompt, temperature, web search toggle
     - Knowledge Base: File upload, embedding model, API key
     - Web Search: SERP API key, max results
     - Output: Display preview

5. **Chat Interface**
   - Modal overlay (not embedded)
   - Real-time message display
   - User/Assistant message distinction
   - Loading state with animated dots

6. **Design System**
   - Color palette matching Figma specs:
     - Primary Green: #4CAF50
     - Light Green: #E8F5E9
     - Purple: #7C3AED
     - Blue: #3B82F6
     - Orange: #F59E0B
   - Handle colors:
     - 🟠 Orange: Query data
     - 🔵 Blue: Context/Output
     - 🟢 Green: Final output
   - Inter font family
   - Consistent spacing and shadows

7. **Floating Action Buttons**
   - 🟢▶ Run/Build Stack button
   - 💬 Chat button
   - Smooth animations

8. **Routing**
   - Hash-based routing (#workflow)
   - Dashboard <-> Workflow Builder navigation
   - Current stack context management

## 🚀 Getting Started

### Installation

\`\`\`bash
cd frontend
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build

\`\`\`bash
npm run build
\`\`\`

## 📁 Project Structure

\`\`\`
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── chat/
│   │   │   └── ChatModal.tsx
│   │   ├── common/
│   │   │   └── CreateStackModal.tsx
│   │   └── nodes/
│   │       ├── InputNode.tsx
│   │       ├── LLMNode.tsx
│   │       ├── KnowledgeBaseNode.tsx
│   │       ├── WebSearchNode.tsx
│   │       ├── OutputNode.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── WorkflowBuilder.tsx
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── chatSlice.ts
│   │   ├── stackSlice.ts
│   │   └── workflowSlice.ts
│   ├── styles/
│   │   ├── Chat.css
│   │   ├── Dashboard.css
│   │   ├── Login.css
│   │   ├── LoginForm.css
│   │   ├── Modal.css
│   │   ├── Nodes.css
│   │   └── WorkflowBuilder.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── package.json
\`\`\`

## 🎯 Key Design Decisions

### 1. Inline Node Configuration
Unlike traditional flow builders, configuration happens **inside each node**, not in a separate right panel. This keeps the workflow focused and reduces context switching.

### 2. Zustand for State Management
Using Zustand instead of Redux for simpler, more intuitive state management:
- `stackSlice`: Manages stacks list and current stack
- `workflowSlice`: Manages nodes, edges, and chat state
- `authSlice`: Manages authentication

### 3. Hash-Based Routing
Simple hash routing (#workflow) instead of react-router for lightweight navigation between Dashboard and Workflow Builder.

### 4. React Flow
Built on react-flow for professional drag-and-drop workflow building with:
- Custom node components
- Color-coded connection handles
- Smooth animations
- Zoom and pan controls

## 🎨 Component Details

### Node Types

All nodes support:
- Expand/collapse with ⚙️ button
- Inline configuration forms
- Color-coded connection handles
- Real-time state updates

#### Input Node
- Single query text area
- Orange handle for query output

#### LLM Node
- Model selection dropdown
- API key with show/hide toggle
- Multi-line prompt editor
- Temperature slider
- Web search toggle
- SERP API key (conditional)
- Orange handle for query input
- Blue handle for context input
- Blue handle for output

#### Knowledge Base Node
- File upload button
- Embedding model selector
- API key input
- Orange handle for query input
- Blue handle for context output

#### Web Search Node
- SERP API key input
- Max results number input
- Orange handle for query input
- Blue handle for results output

#### Output Node
- Display-only preview area
- Green handle for output input

### Connection Handle Colors
- 🟠 **Orange**: Query/user input data flow
- 🔵 **Blue**: Context and intermediate data
- 🟢 **Green**: Final output/result

## 📦 Dependencies

- **react** & **react-dom**: UI framework
- **reactflow**: Drag-and-drop workflow builder
- **zustand**: State management
- **uuid**: Unique ID generation
- **axios**: HTTP client
- **zod**: Schema validation
- **vite**: Build tool

## 🔜 Future Enhancements

- Backend API integration
- Real workflow execution
- Save/load workflows to/from backend
- Node validation
- Connection validation rules
- Workflow templates
- Export/import workflows
- Collaborative editing
- Version history

## 🐛 Known Issues

- Chat currently uses simulated responses (needs backend integration)
- No workflow validation yet
- File uploads need backend endpoint
- Authentication is mock (needs real backend)

## 📝 Notes

This frontend is built to match the exact Figma specifications provided, with:
- All 8 screens implemented
- Exact color scheme
- Proper typography
- Inline node configuration (key difference from typical flow builders)
- Modal-based chat interface

## 🤝 Contributing

When adding new features:
1. Follow the existing design system in `index.css`
2. Add new node types in `components/nodes/`
3. Update state management in appropriate slice files
4. Keep styling consistent with the design specifications
