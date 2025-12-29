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
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useStackStore } from "../store/stackSlice";
import { useWorkflowStore } from "../store/workflowSlice";
import InputNode from "../components/nodes/InputNode";
import LLMNode from "../components/nodes/LLMNode";
import KnowledgeBaseNode from "../components/nodes/KnowledgeBaseNode";
import WebSearchNode from "../components/nodes/WebSearchNode";
import OutputNode from "../components/nodes/OutputNode";
import ConditionalNode from "../components/nodes/ConditionalNode";
import TransformNode from "../components/nodes/TransformNode";
import APINode from "../components/nodes/APINode";
import MemoryNode from "../components/nodes/MemoryNode";
import ValidatorNode from "../components/nodes/ValidatorNode";
import ChatModal from "../components/chat/ChatModal";
import UserMenu from "../components/common/UserMenu";
import Logo from "../components/common/Logo";
import SaveWorkflowModal from "../components/common/SaveWorkflowModal";
import "../styles/WorkflowBuilder.css";

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

const COMPONENTS = [
  { type: "input", icon: "📥", label: "User Query", category: "input" },
  { type: "llm", icon: "✨", label: "LLM (OpenAI)", category: "ai" },
  { type: "knowledge", icon: "📚", label: "Knowledge Base", category: "data" },
  { type: "webSearch", icon: "🌐", label: "Web Search", category: "data" },
  { type: "output", icon: "📤", label: "Output", category: "output" },
  { type: "conditional", icon: "🔀", label: "Conditional", category: "logic" },
  { type: "transform", icon: "🔄", label: "Transform", category: "logic" },
  { type: "api", icon: "🔌", label: "API Call", category: "integration" },
  { type: "memory", icon: "🧠", label: "Memory", category: "ai" },
  { type: "validator", icon: "✅", label: "Validator", category: "logic" },
];

const WorkflowBuilderContent = () => {
  const { currentStack } = useStackStore();
  const { isChatOpen, toggleChat } = useWorkflowStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<"chat" | "components">("components");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

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

      const position = {
        x: event.clientX - reactFlowBounds.left - 150,
        y: event.clientY - reactFlowBounds.top - 50,
      };

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
    [setNodes]
  );

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  const handleBuildStack = () => {
    console.log("Building stack:", { nodes, edges });
    alert("Building stack... Check console for workflow definition.");
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
          <button className="btn-save" onClick={handleSave}>
            💾 Save
          </button>
          <UserMenu />
        </div>
      </header>

      <div className="workflow-content">
        {/* Sidebar with Tabs */}
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

          {/* Tab Content */}
          {activeTab === "chat" ? (
            <div className="sidebar-chat">
              <div className="chat-placeholder">
                <div className="chat-placeholder-icon">💬</div>
                <p>Chat with your AI workflow</p>
                <button className="btn-open-chat" onClick={toggleChat}>
                  Open Chat
                </button>
              </div>
            </div>
          ) : null}

          {/* Components Section - Always visible below */}
          <div className="components-section">
            <h3 className="sidebar-title">Components</h3>
            <div className="component-list">
              {COMPONENTS.map((component) => (
                <div
                  key={component.type}
                  className="component-item"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/reactflow",
                      component.type
                    );
                    event.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <span className="component-icon">{component.icon}</span>
                  <span className="component-label">{component.label}</span>
                </div>
              ))}
            </div>
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
            onMoveEnd={onMoveEnd}
            nodeTypes={nodeTypes}
            fitView
            className="react-flow-canvas"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#9CA3AF", strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="empty-canvas">
              <div className="empty-canvas-icon">🔀</div>
              <p>Drag & drop components to start building</p>
            </div>
          )}

          {/* Custom Zoom Controls - Bottom Center */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
              +
            </button>
            <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
              −
            </button>
            <button className="zoom-btn" onClick={handleFitView} title="Fit View">
              ⛶
            </button>
            <div className="zoom-level-dropdown">
              <span>{zoom}%</span>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>

          {/* Floating Actions - Bottom Right */}
          <div className="floating-actions">
            <button className="fab fab-chat" onClick={toggleChat} title="Chat with Stack">
              💬
            </button>
            <div className="build-stack-container">
              <span className="build-stack-label">Build Stack</span>
              <button className="fab fab-run" onClick={handleBuildStack} title="Build Stack">
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {isChatOpen && <ChatModal />}
      
      {isSaveModalOpen && (
        <SaveWorkflowModal
          nodes={nodes}
          edges={edges}
          onClose={() => setIsSaveModalOpen(false)}
        />
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