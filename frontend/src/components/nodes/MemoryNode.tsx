import { Handle, Position } from "reactflow";
import { useState } from "react";
import "../../styles/Nodes.css";

interface MemoryNodeData {
  memoryType?: string;
  maxMessages?: number;
  onUpdate?: (updates: any) => void;
}

const MemoryNode = ({ data }: { data: MemoryNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [memoryType, setMemoryType] = useState(data.memoryType || "conversation");
  const [maxMessages, setMaxMessages] = useState(data.maxMessages || 10);

  const handleUpdate = (updates: Partial<MemoryNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node memory-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">🧠</span>
          <span>Memory</span>
        </div>
        <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Store and retrieve conversation history</p>

          <div className="form-group">
            <label className="form-label-small">Memory Type</label>
            <select
              className="form-select"
              value={memoryType}
              onChange={(e) => {
                setMemoryType(e.target.value);
                handleUpdate({ memoryType: e.target.value });
              }}
            >
              <option value="conversation">Conversation Buffer</option>
              <option value="summary">Summary Memory</option>
              <option value="window">Sliding Window</option>
              <option value="entity">Entity Memory</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label-small">Max Messages</label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={maxMessages}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxMessages(val);
                  handleUpdate({ maxMessages: val });
                }}
                className="slider"
              />
              <span className="slider-value">{maxMessages}</span>
            </div>
          </div>

          <div className="memory-stats">
            <div className="memory-stat">
              <span className="stat-icon">💬</span>
              <span className="stat-text">0 messages stored</span>
            </div>
          </div>
        </div>
      )}

      {/* Input for new message */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input" 
        className="handle-purple" 
        style={{ top: "40%" }} 
      />
      
      {/* Input for query */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="query" 
        className="handle-orange" 
        style={{ top: "60%" }} 
      />
      
      {/* Output history */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="history" 
        className="handle-blue" 
        style={{ top: "50%" }} 
      />
    </div>
  );
};

export default MemoryNode;