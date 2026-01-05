// src/components/panels/ComponentLibrary.tsx
import { useState, useMemo, useCallback } from "react";
import { useWorkflow } from "../../hooks/useWorkflow";
import { Node } from "reactflow";
import {
  NODE_DEFINITIONS,
  NODE_CATEGORIES,
  NodeCategory,
  NodeDefinition,
  getNodesByCategory,
  searchNodes,
  getNodeCountByCategory,
} from "../../data/nodeDefinitions";
import "../../styles/ComponentLibrary.css";

const ComponentLibrary = () => {
  const { nodes, setNodes } = useWorkflow();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | "all">("all");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedNode, setDraggedNode] = useState<NodeDefinition | null>(null);

  // Get filtered nodes based on search and category
  const filteredNodes = useMemo(() => {
    let result = NODE_DEFINITIONS;

    // Filter by category
    if (selectedCategory !== "all") {
      result = getNodesByCategory(selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const searchResults = searchNodes(searchQuery);
      result = result.filter((node) =>
        searchResults.some((sr) => sr.type === node.type)
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  // Group nodes by category for display
  const groupedNodes = useMemo(() => {
    if (selectedCategory !== "all") {
      return { [selectedCategory]: filteredNodes };
    }

    const groups: Record<string, NodeDefinition[]> = {};
    filteredNodes.forEach((node) => {
      if (!groups[node.category]) {
        groups[node.category] = [];
      }
      groups[node.category].push(node);
    });
    return groups;
  }, [filteredNodes, selectedCategory]);

  const nodeCounts = useMemo(() => getNodeCountByCategory(), []);

  // Add node to canvas
  const addNode = useCallback(
    (nodeDef: NodeDefinition) => {
      const id = `${nodeDef.type}-${Date.now()}`;
      const newNode: Node = {
        id,
        type: nodeDef.type,
        data: {
          label: nodeDef.label,
          ...nodeDef.defaultData,
          onUpdate: (updates: any) => {
            // This will be handled by the workflow store
          },
        },
        position: {
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        },
      };
      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes]
  );

  // Drag handlers for drag-and-drop
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeDef: NodeDefinition
  ) => {
    setDraggedNode(nodeDef);
    e.dataTransfer.setData("application/json", JSON.stringify(nodeDef));
    e.dataTransfer.effectAllowed = "copy";

    // Create custom drag image
    const dragImage = document.createElement("div");
    dragImage.className = "node-drag-image";
    dragImage.innerHTML = `
      <span class="drag-icon">${nodeDef.icon}</span>
      <span class="drag-label">${nodeDef.label}</span>
    `;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: ${nodeDef.bgColor};
      border: 2px solid ${nodeDef.color};
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 25);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  if (isCollapsed) {
    return (
      <div className="component-library collapsed">
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(false)}
          title="Expand Component Library"
        >
          <span className="toggle-icon">▶</span>
          <span className="toggle-label">Components</span>
        </button>
      </div>
    );
  }

  return (
    <div className="component-library">
      {/* Header */}
      <div className="library-header">
        <div className="header-title">
          <span className="header-icon">🧩</span>
          <h3>Components</h3>
          <span className="node-count">{NODE_DEFINITIONS.length}</span>
        </div>
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(true)}
          title="Collapse"
        >
          ◀
        </button>
      </div>

      {/* Search */}
      <div className="library-search">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-label">All</span>
          <span className="tab-count">{NODE_DEFINITIONS.length}</span>
        </button>
        {(Object.keys(NODE_CATEGORIES) as NodeCategory[]).map((category) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
            style={{
              "--category-color": NODE_CATEGORIES[category].color,
            } as React.CSSProperties}
          >
            <span className="tab-icon">{NODE_CATEGORIES[category].icon}</span>
            <span className="tab-label">{NODE_CATEGORIES[category].label}</span>
            <span className="tab-count">{nodeCounts[category]}</span>
          </button>
        ))}
      </div>

      {/* Node List */}
      <div className="node-list">
        {Object.keys(groupedNodes).length === 0 ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <p>No components found</p>
            <button
              className="clear-filters"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(groupedNodes).map(([category, categoryNodes]) => (
            <div key={category} className="node-category-group">
              {selectedCategory === "all" && (
                <div
                  className="category-header"
                  style={{
                    "--category-color": NODE_CATEGORIES[category as NodeCategory]?.color,
                  } as React.CSSProperties}
                >
                  <span className="category-icon">
                    {NODE_CATEGORIES[category as NodeCategory]?.icon}
                  </span>
                  <span className="category-name">
                    {NODE_CATEGORIES[category as NodeCategory]?.label}
                  </span>
                  <span className="category-count">{categoryNodes.length}</span>
                </div>
              )}
              <div className="nodes-grid">
                {categoryNodes.map((nodeDef) => (
                  <div
                    key={nodeDef.type}
                    className={`node-card ${draggedNode?.type === nodeDef.type ? "dragging" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeDef)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addNode(nodeDef)}
                    style={{
                      "--node-color": nodeDef.color,
                      "--node-bg": nodeDef.bgColor,
                    } as React.CSSProperties}
                  >
                    <div className="node-card-header">
                      <span className="node-icon">{nodeDef.icon}</span>
                      <span className="node-label">{nodeDef.label}</span>
                    </div>
                    <p className="node-description">{nodeDef.description}</p>
                    <div className="node-meta">
                      <span className="node-inputs" title="Inputs">
                        ⬅ {nodeDef.inputs.length}
                      </span>
                      <span className="node-outputs" title="Outputs">
                        {nodeDef.outputs.length} ➡
                      </span>
                    </div>
                    <button
                      className="add-node-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addNode(nodeDef);
                      }}
                      title="Add to canvas"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="library-footer">
        <p className="footer-hint">
          💡 Drag components to canvas or click to add
        </p>
      </div>
    </div>
  );
};

export default ComponentLibrary;