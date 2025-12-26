import { Handle, Position } from "reactflow";
import { useState } from "react";
import { WebSearchNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const WebSearchNode = ({ data }: { data: WebSearchNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [maxResults, setMaxResults] = useState(data.maxResults || 5);

  const handleUpdate = (updates: Partial<WebSearchNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node websearch-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">🌐</span>
          <span>Web Search</span>
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="node-divider"></div>
          <div className="node-body">
            <p className="node-description">Search the web for information</p>

            <div className="form-group">
              <label className="form-label-small">SERP API Key</label>
              <div className="input-with-icon">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="form-input-small"
                  placeholder="Enter API Key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    handleUpdate({ apiKey: e.target.value });
                  }}
                />
                <button
                  className="icon-button"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  👁
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-small">Max Results</label>
              <input
                type="number"
                className="form-input-small"
                min="1"
                max="10"
                value={maxResults}
                onChange={(e) => {
                  setMaxResults(parseInt(e.target.value));
                  handleUpdate({ maxResults: parseInt(e.target.value) });
                }}
              />
            </div>
          </div>
        </>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle-orange"
        style={{ top: "50%" }}
      >
        <div className="handle-label-left">Query</div>
      </Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="results"
        className="handle-blue"
        style={{ top: "50%" }}
      >
        <div className="handle-label">Results</div>
      </Handle>
    </div>
  );
};

export default WebSearchNode;
