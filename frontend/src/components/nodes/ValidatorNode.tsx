import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface ValidatorNodeData {
  validationType?: string;
  customRule?: string;
  errorMessage?: string;
  onUpdate?: (updates: any) => void;
}

const ValidatorNode = ({ data }: { data: ValidatorNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [validationType, setValidationType] = useState(data.validationType || "not_empty");
  const [customRule, setCustomRule] = useState(data.customRule || "");
  const [errorMessage, setErrorMessage] = useState(data.errorMessage || "Validation failed");

  const handleUpdate = (updates: Partial<ValidatorNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node validator-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">✅</span>
          <span>Validator</span>
        </div>
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Validate and filter data</p>

          <div className="form-group">
            <label className="form-label-small">Validation Type</label>
            <select
              className="form-select"
              value={validationType}
              onChange={(e) => {
                setValidationType(e.target.value);
                handleUpdate({ validationType: e.target.value });
              }}
            >
              <option value="not_empty">Not Empty</option>
              <option value="is_email">Is Email</option>
              <option value="is_url">Is URL</option>
              <option value="is_json">Is Valid JSON</option>
              <option value="min_length">Min Length</option>
              <option value="max_length">Max Length</option>
              <option value="regex">Regex Pattern</option>
              <option value="custom">Custom Rule</option>
            </select>
          </div>

          {(validationType === "regex" || validationType === "custom") && (
            <div className="form-group">
              <label className="form-label-small">
                {validationType === "regex" ? "Regex Pattern" : "Custom Rule"}
              </label>
              <input
                type="text"
                className="form-input-small"
                placeholder={validationType === "regex" ? "^[a-zA-Z]+$" : "input.length > 10"}
                value={customRule}
                onChange={(e) => {
                  setCustomRule(e.target.value);
                  handleUpdate({ customRule: e.target.value });
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label-small">Error Message</label>
            <input
              type="text"
              className="form-input-small"
              placeholder="Validation failed"
              value={errorMessage}
              onChange={(e) => {
                setErrorMessage(e.target.value);
                handleUpdate({ errorMessage: e.target.value });
              }}
            />
          </div>

          <div className="validation-outputs">
            <div className="validation-output valid">
              <span className="output-indicator">✓</span>
              <span>Valid</span>
            </div>
            <div className="validation-output invalid">
              <span className="output-indicator">✗</span>
              <span>Invalid</span>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input" 
        className="handle-blue" 
        style={{ top: "50%" }} 
      />
      
      {/* Valid output */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="valid" 
        className="handle-green" 
        style={{ top: "40%" }} 
      />
      
      {/* Invalid output */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="invalid" 
        className="handle-orange" 
        style={{ top: "60%" }} 
      />
    </div>
  );
};

export default ValidatorNode;