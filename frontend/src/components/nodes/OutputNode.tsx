import { Handle, Position } from "reactflow";
import { useState } from "react";
import { OutputNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const OutputNode = ({ data }: { data: OutputNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="custom-node output-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">📤</span>
          <span>Output</span>
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Output of the result nodes as text</p>

          <div className="form-group">
            <label className="form-label-small">Output Text</label>
            <div className="output-preview">
              {data.output || "Output will be generated based on query"}
            </div>
          </div>
        </div>
      )}

      {/* Footer with Output handle on bottom left */}
      <div className="node-footer">
        <div className="footer-handle">
          <span className="footer-handle-label">Output</span>
          <Handle
            type="target"
            position={Position.Bottom}
            id="output"
            className="handle-green"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default OutputNode;