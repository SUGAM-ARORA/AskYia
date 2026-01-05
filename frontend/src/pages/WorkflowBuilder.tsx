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

// Import existing nodes
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

// Import GenericNode for new node types
import GenericNode from "../components/nodes/GenericNode";

// Import node definitions and templates from data files
import { NODE_DEFINITIONS, NODE_CATEGORIES, NodeCategory, NodeDefinition } from "../data/nodeDefinitions";
import { WORKFLOW_TEMPLATES, TEMPLATE_CATEGORIES, WorkflowTemplate } from "../data/templates";

import AnimatedEdge from "../components/edges/AnimatedEdge";
import ChatModal from "../components/chat/ChatModal";
import ThemeToggle from "../components/common/ThemeToggle";
import UserMenu from "../components/common/UserMenu";
import Logo from "../components/common/Logo";
import SaveWorkflowModal from "../components/common/SaveWorkflowModal";
import Tooltip from "../components/common/Tooltip";
import ApiKeyManager from "../components/common/ApiKeyManager";
import ExecutionPanel from "../components/execution/ExecutionPanel";
import TemplateModal from "../components/templates/TemplateModal";
import { useWorkflowExecution } from "../hooks/useWorkflowExecution";
import "../styles/WorkflowBuilder.css";
import "../styles/Execution.css";

// Node types mapping - existing custom nodes + GenericNode for new types
const nodeTypes: NodeTypes = {
  // Existing custom implementations
  input: InputNode,
  llm: LLMNode,
  knowledge: KnowledgeBaseNode,
  knowledgeBase: KnowledgeBaseNode,
  webSearch: WebSearchNode,
  output: OutputNode,
  conditional: ConditionalNode,
  transform: TransformNode,
  api: APINode,
  httpRequest: APINode,
  memory: MemoryNode,
  validator: ValidatorNode,
  
  // New nodes using GenericNode
  llmChat: GenericNode,
  textClassifier: GenericNode,
  sentimentAnalyzer: GenericNode,
  textSummarizer: GenericNode,
  entityExtractor: GenericNode,
  translator: GenericNode,
  codeGenerator: GenericNode,
  imageAnalyzer: GenericNode,
  embeddingGenerator: GenericNode,
  qaExtractor: GenericNode,
  contentModerator: GenericNode,
  jsonParser: GenericNode,
  csvParser: GenericNode,
  xmlParser: GenericNode,
  dataValidator: GenericNode,
  dataMapper: GenericNode,
  arrayProcessor: GenericNode,
  variableStore: GenericNode,
  variableReader: GenericNode,
  webhookTrigger: GenericNode,
  database: GenericNode,
  googleSheets: GenericNode,
  notion: GenericNode,
  airtable: GenericNode,
  github: GenericNode,
  linkedin: GenericNode,
  twitter: GenericNode,
  youtube: GenericNode,
  stripe: GenericNode,
  aws: GenericNode,
  firebase: GenericNode,
  switch: GenericNode,
  loop: GenericNode,
  delay: GenericNode,
  retry: GenericNode,
  merge: GenericNode,
  split: GenericNode,
  errorHandler: GenericNode,
  email: GenericNode,
  slack: GenericNode,
  discord: GenericNode,
  sms: GenericNode,
  pushNotification: GenericNode,
  textFormatter: GenericNode,
};

const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
};

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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  
  // Component library state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | "all">("all");
  const [isComponentLibraryCollapsed, setIsComponentLibraryCollapsed] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  // Workflow execution hook
  const { execute, cancel } = useWorkflowExecution();

  // Filter nodes based on search and category
  const filteredNodes = NODE_DEFINITIONS.filter((node) => {
    const matchesCategory = selectedCategory === "all" || node.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group nodes by category
  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeDefinition[]>);

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

      if (snapToGridEnabled) {
        position = snapToGrid(position);
      }

      // Get node definition for default data
      const nodeDef = NODE_DEFINITIONS.find(n => n.type === type);

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: {
          label: nodeDef?.label || type,
          ...(nodeDef?.defaultData || {}),
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

  const handleAddNode = (nodeDef: NodeDefinition) => {
    const newNode: Node = {
      id: uuidv4(),
      type: nodeDef.type,
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: nodeDef.label,
        ...nodeDef.defaultData,
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
  };

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  const handleBuildStack = () => {
    if (nodes.length === 0) {
      alert("Please add some nodes to the workflow first.");
      return;
    }

    if (isExecuting) {
      cancel();
      return;
    }

    resetExecution();

    const inputNode = nodes.find((n) => n.type === "input");
    const query = inputNode?.data?.query || "Hello, how can you help me?";

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

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    const nodesWithHandlers = template.nodes.map((node) => {
      const newId = uuidv4();
      return {
        ...node,
        id: newId,
        data: {
          ...node.data,
          onUpdate: (updates: any) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === newId ? { ...n, data: { ...n.data, ...updates } } : n
              )
            );
          },
        },
      };
    });

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
    setIsTemplateModalOpen(false);
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

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          if (config.nodes && config.edges) {
            const nodesWithHandlers = config.nodes.map((node: any) => ({
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
            setEdges(config.edges.map((e: any) => ({ ...e, animated: true })));
          } else {
            alert("Invalid config file. Must contain 'nodes' and 'edges'.");
          }
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
          <Tooltip content="Browse workflow templates">
            <button className="btn-icon" onClick={() => setIsTemplateModalOpen(true)}>
              📋 Templates
            </button>
          </Tooltip>
          <Tooltip content="Import workflow from JSON">
            <button className="btn-icon" onClick={handleImportJSON}>
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
        {/* Enhanced Component Library Sidebar */}
        <aside className={`component-library-new ${isComponentLibraryCollapsed ? 'collapsed' : ''}`}>
          {isComponentLibraryCollapsed ? (
            <button
              className="collapse-toggle-btn"
              onClick={() => setIsComponentLibraryCollapsed(false)}
              title="Expand"
            >
              <span className="toggle-icon">▶</span>
              <span className="toggle-text">Components</span>
            </button>
          ) : (
            <>
              {/* Header */}
              <div className="library-header">
                <div className="header-info">
                  <span className="header-icon">🧩</span>
                  <h3>Components</h3>
                  <span className="node-count-badge">{NODE_DEFINITIONS.length}</span>
                </div>
                <button
                  className="collapse-btn"
                  onClick={() => setIsComponentLibraryCollapsed(true)}
                  title="Collapse"
                >
                  ◀
                </button>
              </div>

              {/* Chat Button */}
              <div className="chat-section">
                <button className="chat-with-ai-btn" onClick={toggleChat}>
                  <span className="chat-icon">💬</span>
                  <span>Chat With AI</span>
                </button>
              </div>

              {/* Search */}
              <div className="search-section">
                <div className="search-input-container">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="category-filter">
                <button
                  className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </button>
                {(Object.keys(NODE_CATEGORIES) as NodeCategory[]).map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ '--cat-color': NODE_CATEGORIES[cat].color } as React.CSSProperties}
                  >
                    <span>{NODE_CATEGORIES[cat].icon}</span>
                    <span>{NODE_CATEGORIES[cat].label}</span>
                  </button>
                ))}
              </div>

              {/* Node List */}
              <div className="node-list-container">
                {Object.keys(groupedNodes).length === 0 ? (
                  <div className="no-nodes-found">
                    <span>🔍</span>
                    <p>No components found</p>
                    <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                      Clear filters
                    </button>
                  </div>
                ) : (
                  Object.entries(groupedNodes).map(([category, categoryNodes]) => (
                    <div key={category} className="node-category-section">
                      {selectedCategory === 'all' && (
                        <div 
                          className="category-title"
                          style={{ '--cat-color': NODE_CATEGORIES[category as NodeCategory]?.color } as React.CSSProperties}
                        >
                          <span>{NODE_CATEGORIES[category as NodeCategory]?.icon}</span>
                          <span>{NODE_CATEGORIES[category as NodeCategory]?.label}</span>
                          <span className="cat-count">{categoryNodes.length}</span>
                        </div>
                      )}
                      <div className="nodes-list">
                        {categoryNodes.map((nodeDef) => (
                          <Tooltip key={nodeDef.type} content={nodeDef.description} position="right">
                            <div
                              className="node-item"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/reactflow", nodeDef.type);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onClick={() => handleAddNode(nodeDef)}
                              style={{ '--node-color': nodeDef.color } as React.CSSProperties}
                            >
                              <span className="node-icon">{nodeDef.icon}</span>
                              <span className="node-label">{nodeDef.label}</span>
                              <button
                                className="add-node-quick"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddNode(nodeDef);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Settings */}
              <div className="settings-section">
                <h4>Settings</h4>
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={snapToGridEnabled}
                    onChange={(e) => setSnapToGridEnabled(e.target.checked)}
                  />
                  <span>Snap to Grid</span>
                </label>
              </div>
            </>
          )}
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
                const nodeDef = NODE_DEFINITIONS.find(n => n.type === node.type);
                return nodeDef?.color || "#9CA3AF";
              }}
              maskColor="rgba(0,0,0,0.1)"
              style={{ background: "#F5F5F5" }}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="empty-canvas">
              <div className="empty-canvas-icon">🔀</div>
              <p>Drag & drop components to start building</p>
              <button className="btn-import-template" onClick={() => setIsTemplateModalOpen(true)}>
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

{isTemplateModalOpen && (
  <TemplateModal
    isOpen={isTemplateModalOpen}
    onClose={() => setIsTemplateModalOpen(false)}
    onLoadTemplate={(nodes, edges) => {
      // Add onUpdate handlers to nodes
      const nodesWithHandlers = nodes.map((node: any) => ({
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
      setEdges(edges);
    }}
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