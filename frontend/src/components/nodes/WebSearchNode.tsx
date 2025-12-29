import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface WebSearchNodeData {
  apiKey?: string;
  maxResults?: number;
  searchEngine?: string;
  onUpdate?: (updates: any) => void;
}

const WebSearchNode = ({ data }: { data: WebSearchNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [maxResults, setMaxResults] = useState(data.maxResults || 5);
  const [searchEngine, setSearchEngine] = useState(data.searchEngine || "google");
  const [showApiKey, setShowApiKey] = useState(false);

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
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Search the web for information</p>

          <div className="form-group">
            <label className="form-label-small">Search Engine</label>
            <select
              className="form-select"
              value={searchEngine}
              onChange={(e) => {
                setSearchEngine(e.target.value);
                handleUpdate({ searchEngine: e.target.value });
              }}
            >
              <option value="google">Google (SerpAPI)</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label-small">API Key</label>
            <div className="input-with-icon">
              <input
                type={showApiKey ? "text" : "password"}
                className="form-input-small"
                placeholder="Enter API key..."
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
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={maxResults}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxResults(val);
                  handleUpdate({ maxResults: val });
                }}
                className="slider"
              />
              <span className="slider-value">{maxResults}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Handles */}
      <div className="node-footer">
        <div className="footer-handle">
          <span className="footer-handle-label">Query</span>
          <Handle
            type="target"
            position={Position.Bottom}
            id="query"
            className="handle-orange"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
        <div className="footer-handle">
          <span className="footer-handle-label">Results</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="results"
            className="handle-green"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default WebSearchNode;