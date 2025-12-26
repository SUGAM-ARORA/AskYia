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
        <>
          <div className="node-divider"></div>
          <div className="node-body">
            <p className="node-description">
              Output of the result nodes as text
            </p>

            <div className="form-group">
              <label className="form-label-small">Output Text</label>
              <div className="output-preview">
                {data.output || "Output will be generated based on query"}
              </div>
            </div>
          </div>
        </>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="output"
        className="handle-green"
        style={{ top: "50%" }}
      >
        <div className="handle-label-left">Output</div>
      </Handle>
    </div>
  );
};

export default OutputNode;
