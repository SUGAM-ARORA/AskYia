import { Handle, Position } from "reactflow";
import { useState } from "react";
import { InputNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const InputNode = ({ data }: { data: InputNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [query, setQuery] = useState(data.query || "");

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (data.onUpdate) {
      data.onUpdate({ query: value });
    }
  };

  return (
    <div className="custom-node input-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">📥</span>
          <span>User Query</span>
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
            <p className="node-description">Enter point for queries</p>

            <div className="form-group">
              <label className="form-label-small">User Query</label>
              <textarea
                className="form-input-small"
                placeholder="Write your query here"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="query"
        className="handle-orange"
        style={{ top: "50%" }}
      >
        <div className="handle-label">Query</div>
      </Handle>
    </div>
  );
};

export default InputNode;
