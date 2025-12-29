import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface TransformNodeData {
  transformType?: string;
  template?: string;
  onUpdate?: (updates: any) => void;
}

const TransformNode = ({ data }: { data: TransformNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [transformType, setTransformType] = useState(data.transformType || "template");
  const [template, setTemplate] = useState(data.template || "");

  const handleUpdate = (updates: Partial<TransformNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node transform-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">🔄</span>
          <span>Transform</span>
        </div>
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Transform or format data</p>

          <div className="form-group">
            <label className="form-label-small">Transform Type</label>
            <select
              className="form-select"
              value={transformType}
              onChange={(e) => {
                setTransformType(e.target.value);
                handleUpdate({ transformType: e.target.value });
              }}
            >
              <option value="template">Template</option>
              <option value="json">JSON Parse</option>
              <option value="extract">Extract Field</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="trim">Trim</option>
            </select>
          </div>

          {transformType === "template" && (
            <div className="form-group">
              <label className="form-label-small">Template</label>
              <textarea
                className="form-input-small"
                placeholder="Use {input} for the input value"
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  handleUpdate({ template: e.target.value });
                }}
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} id="input" className="handle-blue" style={{ top: "50%" }} />
      <Handle type="source" position={Position.Right} id="output" className="handle-blue" style={{ top: "50%" }} />
    </div>
  );
};

export default TransformNode;