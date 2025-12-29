import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface APINodeData {
  url?: string;
  method?: string;
  headers?: string;
  onUpdate?: (updates: any) => void;
}

const APINode = ({ data }: { data: APINodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [url, setUrl] = useState(data.url || "");
  const [method, setMethod] = useState(data.method || "GET");
  const [headers, setHeaders] = useState(data.headers || "");

  const handleUpdate = (updates: Partial<APINodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node api-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">🔌</span>
          <span>API Call</span>
        </div>
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Make external API requests</p>

          <div className="form-group">
            <label className="form-label-small">Method</label>
            <select
              className="form-select"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                handleUpdate({ method: e.target.value });
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label-small">URL</label>
            <input
              type="text"
              className="form-input-small"
              placeholder="https://api.example.com/endpoint"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                handleUpdate({ url: e.target.value });
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label-small">Headers (JSON)</label>
            <textarea
              className="form-input-small"
              placeholder='{"Authorization": "Bearer ..."}'
              value={headers}
              onChange={(e) => {
                setHeaders(e.target.value);
                handleUpdate({ headers: e.target.value });
              }}
              rows={2}
            />
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} id="body" className="handle-purple" style={{ top: "50%" }} />
      <Handle type="source" position={Position.Right} id="response" className="handle-green" style={{ top: "50%" }} />
    </div>
  );
};

export default APINode;