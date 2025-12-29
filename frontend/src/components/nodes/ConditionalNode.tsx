import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface ConditionalNodeData {
  condition?: string;
  onUpdate?: (updates: any) => void;
}

const ConditionalNode = ({ data }: { data: ConditionalNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [condition, setCondition] = useState(data.condition || "");

  const handleUpdate = (updates: Partial<ConditionalNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node conditional-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">🔀</span>
          <span>Conditional</span>
        </div>
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Route flow based on conditions</p>

          <div className="form-group">
            <label className="form-label-small">Condition</label>
            <input
              type="text"
              className="form-input-small"
              placeholder="e.g., input.length > 100"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                handleUpdate({ condition: e.target.value });
              }}
            />
          </div>

          <div className="condition-outputs">
            <div className="condition-output true">
              <span className="condition-label">✓ True</span>
            </div>
            <div className="condition-output false">
              <span className="condition-label">✗ False</span>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <Handle type="target" position={Position.Left} id="input" className="handle-purple" style={{ top: "50%" }} />
      
      {/* Outputs */}
      <Handle type="source" position={Position.Right} id="true" className="handle-green" style={{ top: "40%" }} />
      <Handle type="source" position={Position.Right} id="false" className="handle-orange" style={{ top: "60%" }} />
    </div>
  );
};

export default ConditionalNode;