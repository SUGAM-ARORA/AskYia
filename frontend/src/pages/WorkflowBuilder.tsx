import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useStackStore } from "../store/stackSlice";
import { useWorkflowStore } from "../store/workflowSlice";
import { useExecutionStore } from "../store/executionSlice";
import InputNode from "../components/nodes/InputNode";
import LLMNode from "../components/nodes/LLMNode";
import KnowledgeBaseNode from "../components/nodes/KnowledgeBaseNode";
import WebSearchNode from "../components/nodes/WebSearchNode";
import OutputNode from "../components/nodes/OutputNode";
import ConditionalNode from "../components/nodes/ConditionalNode";
import APINode from "../components/nodes/APINode";
import MemoryNode from "../components/nodes/MemoryNode";
import ValidatorNode from "../components/nodes/ValidatorNode";
import TransformNode from "../components/nodes/TransformNode";
import AnimatedEdge from "../components/edges/AnimatedEdge";
import ChatModal from "../components/chat/ChatModal";
import ThemeToggle from "../components/common/ThemeToggle";
import UserMenu from "../components/common/UserMenu";
import Logo from "../components/common/Logo";
import SaveWorkflowModal from "../components/common/SaveWorkflowModal";
import ImportConfigModal from "../components/common/ImportConfigModal";
import Tooltip from "../components/common/Tooltip";
import ApiKeyManager from "../components/common/ApiKeyManager";
import ExecutionPanel from "../components/execution/ExecutionPanel";
import { useWorkflowExecution } from "../hooks/useWorkflowExecution";
import "../styles/WorkflowBuilder.css";
import "../styles/Execution.css";

const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  knowledge: KnowledgeBaseNode,
  webSearch: WebSearchNode,
  output: OutputNode,
  conditional: ConditionalNode,
  transform: TransformNode,
  api: APINode,
  memory: MemoryNode,
  validator: ValidatorNode,
};

const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
};

const COMPONENTS = [
  { type: "input", icon: "📥", label: "User Query", category: "input", tooltip: "Entry point for user queries" },
  { type: "llm", icon: "✨", label: "LLM", category: "ai", tooltip: "Process queries with AI models (OpenAI, Gemini, Claude, etc.)" },
  { type: "knowledge", icon: "📚", label: "Knowledge Base", category: "data", tooltip: "Search information in uploaded documents" },
  { type: "webSearch", icon: "🌐", label: "Web Search", category: "data", tooltip: "Search the web for information" },
  { type: "output", icon: "📤", label: "Output", category: "output", tooltip: "Display final results" },
  { type: "conditional", icon: "🔀", label: "Conditional", category: "logic", tooltip: "Route flow based on conditions" },
  { type: "transform", icon: "🔄", label: "Transform", category: "logic", tooltip: "Transform or format data" },
  { type: "api", icon: "🔌", label: "API Call", category: "integration", tooltip: "Make external API requests" },
  { type: "memory", icon: "🧠", label: "Memory", category: "ai", tooltip: "Store conversation history" },
  { type: "validator", icon: "✅", label: "Validator", category: "logic", tooltip: "Validate and filter data" },
];

// Predefined workflow templates
const WORKFLOW_TEMPLATES = [
  {
    name: "Simple Chat",
    description: "Basic user query to LLM flow",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 200 }, data: { label: "input" } },
      { id: "2", type: "llm", position: { x: 400, y: 200 }, data: { label: "llm", provider: "openai", model: "gpt-4o-mini" } },
      { id: "3", type: "output", position: { x: 700, y: 200 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "output", targetHandle: "output" },
    ],
  },
  {
    name: "PDF Chat",
    description: "Chat with PDF documents using knowledge base",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 150 }, data: { label: "input" } },
      { id: "2", type: "knowledge", position: { x: 100, y: 350 }, data: { label: "knowledge" } },
      { id: "3", type: "llm", position: { x: 450, y: 250 }, data: { label: "llm", provider: "openai", model: "gpt-4o-mini" } },
      { id: "4", type: "output", position: { x: 750, y: 250 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e1-3", source: "1", target: "3", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "context", targetHandle: "context" },
      { id: "e3-4", source: "3", target: "4", sourceHandle: "output", targetHandle: "output" },
    ],
  },
  {
    name: "Web Search Agent",
    description: "Search the web and process results with LLM",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 200 }, data: { label: "input" } },
      { id: "2", type: "webSearch", position: { x: 350, y: 200 }, data: { label: "webSearch" } },
      { id: "3", type: "llm", position: { x: 600, y: 200 }, data: { label: "llm", provider: "google", model: "gemini-1.5-flash" } },
      { id: "4", type: "output", position: { x: 850, y: 200 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "results", targetHandle: "context" },
      { id: "e1-3", source: "1", target: "3", sourceHandle: "query", targetHandle: "query" },
      { id: "e3-4", source: "3", target: "4", sourceHandle: "output", targetHandle: "output" },
    ],
  },
  {
    name: "Claude Assistant",
    description: "Chat using Anthropic Claude models",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 200 }, data: { label: "input" } },
      { id: "2", type: "llm", position: { x: 400, y: 200 }, data: { label: "llm", provider: "anthropic", model: "claude-3-5-sonnet-20241022" } },
      { id: "3", type: "output", position: { x: 700, y: 200 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "output", targetHandle: "output" },
    ],
  },
  {
    name: "Gemini Chat",
    description: "Chat using Google Gemini models",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 200 }, data: { label: "input" } },
      { id: "2", type: "llm", position: { x: 400, y: 200 }, data: { label: "llm", provider: "google", model: "gemini-2.0-flash-exp" } },
      { id: "3", type: "output", position: { x: 700, y: 200 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "output", targetHandle: "output" },
    ],
  },
  {
    name: "Groq Fast Inference",
    description: "Ultra-fast chat using Groq's LPU",
    nodes: [
      { id: "1", type: "input", position: { x: 100, y: 200 }, data: { label: "input" } },
      { id: "2", type: "llm", position: { x: 400, y: 200 }, data: { label: "llm", provider: "groq", model: "llama-3.3-70b-versatile" } },
      { id: "3", type: "output", position: { x: 700, y: 200 }, data: { label: "output" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", sourceHandle: "query", targetHandle: "query" },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "output", targetHandle: "output" },
    ],
  },
];

// Grid size for snap-to-grid
const GRID_SIZE = 20;

const snapToGrid = (position: { x: number; y: number }) => ({
  x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
});

const WorkflowBuilderContent = () => {
  const { currentStack } = useStackStore();
  const { isChatOpen, toggleChat } = useWorkflowStore();
  const { showExecutionPanel, setShowExecutionPanel, isExecuting, resetExecution } = useExecutionStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<"chat" | "components">("components");
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  // Workflow execution hook
  const { execute, cancel } = useWorkflowExecution();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      let position = {
        x: event.clientX - reactFlowBounds.left - 150,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      // Apply snap-to-grid if enabled
      if (snapToGridEnabled) {
        position = snapToGrid(position);
      }

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: {
          label: type,
          onUpdate: (updates: any) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, ...updates } }
                  : node
              )
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, snapToGridEnabled]
  );

  // Handle node drag end with snap-to-grid
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (snapToGridEnabled) {
        const snappedPosition = snapToGrid(node.position);
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, position: snappedPosition } : n
          )
        );
      }
    },
    [setNodes, snapToGridEnabled]
  );

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  const handleBuildStack = () => {
    if (nodes.length === 0) {
      alert("Please add some nodes to the workflow first.");
      return;
    }

    if (isExecuting) {
      // Cancel current execution
      cancel();
      return;
    }

    // Reset any previous execution state
    resetExecution();

    // Get query from input node
    const inputNode = nodes.find((n) => n.type === "input");
    const query = inputNode?.data?.query || "Hello, how can you help me?";

    // Start execution
    execute(nodes, edges, query, {
      onComplete: (result) => {
        console.log("Workflow completed:", result);
      },
      onError: (error) => {
        console.error("Workflow error:", error);
      },
      onNodeStart: (nodeId) => {
        console.log("Node started:", nodeId);
      },
      onNodeComplete: (nodeId, output) => {
        console.log("Node completed:", nodeId, output);
      },
    });
  };

  const handleImportTemplate = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    // Add onUpdate handlers to nodes
    const nodesWithHandlers = template.nodes.map((node) => ({
      ...node,
      id: uuidv4(),
      data: {
        ...node.data,
        onUpdate: (updates: any) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id ? { ...n, data: { ...n.data, ...updates } } : n
            )
          );
        },
      },
    }));

    // Update edge references
    const nodeIdMap: Record<string, string> = {};
    template.nodes.forEach((oldNode, index) => {
      nodeIdMap[oldNode.id] = nodesWithHandlers[index].id;
    });

    const updatedEdges = template.edges.map((edge) => ({
      ...edge,
      id: uuidv4(),
      source: nodeIdMap[edge.source],
      target: nodeIdMap[edge.target],
      animated: true,
    }));

    setNodes(nodesWithHandlers);
    setEdges(updatedEdges);
    setIsImportModalOpen(false);
  };

  const handleImportJSON = (config: { nodes: any[]; edges: any[] }) => {
    const nodesWithHandlers = config.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onUpdate: (updates: any) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id ? { ...n, data: { ...n.data, ...updates } } : n
            )
          );
        },
      },
    }));

    setNodes(nodesWithHandlers);
    setEdges(config.edges.map((e) => ({ ...e, animated: true })));
    setIsImportModalOpen(false);
  };

  const handleExportJSON = () => {
    const config = { nodes, edges };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentStack?.name || "workflow"}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    zoomIn();
    setTimeout(() => setZoom(Math.round(getZoom() * 100)), 50);
  };

  const handleZoomOut = () => {
    zoomOut();
    setTimeout(() => setZoom(Math.round(getZoom() * 100)), 50);
  };

  const handleFitView = () => {
    fitView();
    setTimeout(() => setZoom(Math.round(getZoom() * 100)), 100);
  };

  const onMoveEnd = useCallback(() => {
    setZoom(Math.round(getZoom() * 100));
  }, [getZoom]);

  if (!currentStack) {
    return (
      <div className="workflow-builder-empty">
        <p>Please select a stack from the dashboard to edit</p>
        <button onClick={() => (window.location.hash = "")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="workflow-builder">
      <header className="workflow-header">
        <div className="header-left">
          <Logo size={28} showText={true} />
          <div className="stack-name">
            <span>{currentStack.name}</span>
            <span className="edit-icon">📝</span>
          </div>
        </div>
        <div className="header-right">
          <Tooltip content="Import predefined configurations">
            <button className="btn-icon" onClick={() => setIsImportModalOpen(true)}>
              📥 Import
            </button>
          </Tooltip>
          <Tooltip content="Export current workflow as JSON">
            <button className="btn-icon" onClick={handleExportJSON}>
              📤 Export
            </button>
          </Tooltip>
          <Tooltip content="Manage API Keys for all providers">
            <button className="btn-icon" onClick={() => setIsApiKeyManagerOpen(true)}>
              🔑 Keys
            </button>
          </Tooltip>
          <Tooltip content="View execution logs and progress">
            <button 
              className={`btn-icon ${showExecutionPanel ? 'active' : ''}`} 
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            >
              ⚡ Logs
            </button>
          </Tooltip>
          <button className="btn-save" onClick={handleSave}>
            💾 Save
          </button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="workflow-content">
        {/* Sidebar */}
        <aside className="component-library">
          {/* Tab Headers */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <span>Chat With AI</span>
              <span className="tab-icon">🤖</span>
            </button>
          </div>

          {activeTab === "chat" && (
            <div className="sidebar-chat">
              <div className="chat-placeholder">
                <div className="chat-placeholder-icon">💬</div>
                <p>Chat with your AI workflow</p>
                <button className="btn-open-chat" onClick={toggleChat}>
                  Open Chat
                </button>
              </div>
            </div>
          )}

          {/* Components Section */}
          <div className="components-section">
            <h3 className="sidebar-title">Components</h3>
            <div className="component-list">
              {COMPONENTS.map((component) => (
                <Tooltip key={component.type} content={component.tooltip} position="right">
                  <div
                    className="component-item"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/reactflow", component.type);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <span className="component-icon">{component.icon}</span>
                    <span className="component-label">{component.label}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Grid Settings */}
          <div className="sidebar-settings">
            <h3 className="sidebar-title">Settings</h3>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={snapToGridEnabled}
                onChange={(e) => setSnapToGridEnabled(e.target.checked)}
              />
              <span>Snap to Grid</span>
            </label>
          </div>
        </aside>

        <div className="canvas-container" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStop={onNodeDragStop}
            onMoveEnd={onMoveEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid={snapToGridEnabled}
            snapGrid={[GRID_SIZE, GRID_SIZE]}
            className="react-flow-canvas"
            defaultEdgeOptions={{
              type: 'default',
              animated: false,
              style: { stroke: "#9CA3AF", strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={GRID_SIZE}
              size={1}
              color="#E5E7EB"
            />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "llm": return "#7C3AED";
                  case "input": return "#F59E0B";
                  case "output": return "#F59E0B";
                  case "knowledge": return "#3B82F6";
                  case "webSearch": return "#4CAF50";
                  default: return "#9CA3AF";
                }
              }}
              maskColor="rgba(0,0,0,0.1)"
              style={{ background: "#F5F5F5" }}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="empty-canvas">
              <div className="empty-canvas-icon">🔀</div>
              <p>Drag & drop components to start building</p>
              <button className="btn-import-template" onClick={() => setIsImportModalOpen(true)}>
                Or import a template
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
            <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
            <button className="zoom-btn" onClick={handleFitView} title="Fit View">⛶</button>
            <div className="zoom-level-dropdown">
              <span>{zoom}%</span>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>

          {/* Floating Actions */}
          <div className="floating-actions">
            <button className="fab fab-chat" onClick={toggleChat} title="Chat with Stack">
              💬
            </button>
            <div className="build-stack-container">
              <span className="build-stack-label">
                {isExecuting ? "Running..." : "Build Stack"}
              </span>
              <button 
                className={`fab fab-run ${isExecuting ? 'executing' : ''}`} 
                onClick={handleBuildStack} 
                title={isExecuting ? "Cancel Execution" : "Build Stack"}
              >
                {isExecuting ? "⏹" : "▶"}
              </button>
            </div>
          </div>

          {/* Execution Panel */}
          {showExecutionPanel && (
            <ExecutionPanel onClose={() => setShowExecutionPanel(false)} />
          )}
        </div>
      </div>

      {/* Modals */}
      {isChatOpen && <ChatModal />}

      {isSaveModalOpen && (
        <SaveWorkflowModal
          nodes={nodes}
          edges={edges}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <ImportConfigModal
          templates={WORKFLOW_TEMPLATES}
          onImportTemplate={handleImportTemplate}
          onImportJSON={handleImportJSON}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isApiKeyManagerOpen && (
        <ApiKeyManager onClose={() => setIsApiKeyManagerOpen(false)} />
      )}
    </div>
  );
};

const WorkflowBuilder = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;