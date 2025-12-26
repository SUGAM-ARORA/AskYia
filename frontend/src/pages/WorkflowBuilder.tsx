import { useCallback, useRef, useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
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
import ChatModal from "../components/chat/ChatModal";
import "../styles/WorkflowBuilder.css";

const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  knowledge: KnowledgeBaseNode,
  webSearch: WebSearchNode,
  output: OutputNode,
};

const WorkflowBuilder = () => {
  const { currentStack } = useStackStore();
  const { isChatOpen, toggleChat } = useWorkflowStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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

      const position = {
        x: event.clientX - 200,
        y: event.clientY - 100,
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
    console.log("Saving workflow:", { nodes, edges });
    alert("Workflow saved successfully!");
  };

  const handleBuildStack = () => {
    console.log("Building stack:", { nodes, edges });
    alert("Building stack...");
  };

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
          <div className="logo">
            <span className="logo-icon">🟢</span>
            <span className="logo-text">GenAI Stack</span>
          </div>
          <div className="stack-name">
            <span>{currentStack.name}</span>
            <span className="edit-icon">📝</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-save" onClick={handleSave}>
            💾 Save
          </button>
          <button className="user-button">S</button>
        </div>
      </header>

      <div className="workflow-content">
        <aside className="component-library">
          <h3 className="sidebar-title">Components</h3>
          <div className="component-list">
            {[
              { type: "input", icon: "📥", label: "Input" },
              { type: "llm", icon: "✨", label: "LLM" },
              { type: "knowledge", icon: "📚", label: "Knowledge" },
              { type: "webSearch", icon: "🌐", label: "Web Search" },
              { type: "output", icon: "📤", label: "Output" },
            ].map((component) => (
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
                <span className="drag-handle">≡</span>
              </div>
            ))}
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
            nodeTypes={nodeTypes}
            fitView
            className="react-flow-canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="empty-canvas">
              <div className="empty-canvas-icon">🔀</div>
              <p>Drag & drop to start</p>
            </div>
          )}

          <div className="floating-actions">
            <button className="fab fab-chat" onClick={toggleChat}>
              💬
            </button>
            <button className="fab fab-run" onClick={handleBuildStack}>
              ▶
            </button>
          </div>
        </div>
      </div>

      {isChatOpen && <ChatModal />}
    </div>
  );
};

export default WorkflowBuilder;
