import { Handle, Position } from "reactflow";
import { useState } from "react";
import { OutputNodeData } from "../../types/node.types";
import { useExecutionStore } from "../../store/executionSlice";
import "../../styles/Nodes.css";

const OutputNode = ({ data, id }: { data: OutputNodeData; id: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  const { 
    finalOutput, 
    currentExecution, 
    isExecuting,
    clearOutput,
    clearCurrentExecution 
  } = useExecutionStore();
  
  // Get node-specific status
  const nodeStatus = currentExecution?.nodeStates[id]?.status || 'idle';
  const nodeOutput = currentExecution?.nodeStates[id]?.output;

  // Determine what to display
  const displayOutput = finalOutput || 
                        nodeOutput?.answer || 
                        data.output || 
                        null;

  // Status-based styling
  const getStatusClass = () => {
    switch (nodeStatus) {
      case 'running': return 'node-running';
      case 'success': return 'node-success';
      case 'error': return 'node-error';
      default: return '';
    }
  };

  // Copy to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayOutput) {
      await navigator.clipboard.writeText(displayOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clear output
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearOutput();
    clearCurrentExecution();
  };

  // Truncate for preview
  const truncatedOutput = displayOutput && displayOutput.length > 250 
    ? displayOutput.slice(0, 250) + '...' 
    : displayOutput;

  return (
    <>
      <div className={`custom-node output-node ${getStatusClass()}`}>
        {/* Input Handle on Top */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          className="handle-target"
        />

        <div className="node-header">
          <div className="node-title">
            <span className="node-icon">📤</span>
            <span>Output</span>
            {nodeStatus === 'running' && (
              <span className="status-indicator running">⏳</span>
            )}
            {nodeStatus === 'success' && (
              <span className="status-indicator success">✅</span>
            )}
            {nodeStatus === 'error' && (
              <span className="status-indicator error">❌</span>
            )}
          </div>
          <button
            className="node-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {isExpanded && (
          <div className="node-body">
            <p className="node-description">Output of the result nodes as text</p>

            <div className="form-group">
              <div className="output-label-row">
                <label className="form-label-small">Output Text</label>
                {displayOutput && (
                  <div className="output-btn-group">
                    <button 
                      className="output-mini-btn"
                      onClick={handleCopy}
                      title="Copy to clipboard"
                    >
                      {copied ? '✅' : '📋'}
                    </button>
                    <button 
                      className="output-mini-btn"
                      onClick={(e) => { e.stopPropagation(); setShowFullOutput(true); }}
                      title="View full output"
                    >
                      🔍
                    </button>
                    <button 
                      className="output-mini-btn danger"
                      onClick={handleClear}
                      title="Clear output"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              <div className={`output-preview ${displayOutput ? 'has-content' : ''}`}>
                {isExecuting && nodeStatus === 'running' ? (
                  <div className="output-loading">
                    <span className="loading-spinner-icon">⏳</span>
                    <span>Generating response...</span>
                  </div>
                ) : displayOutput ? (
                  <div className="output-text-content">
                    {truncatedOutput}
                    {displayOutput.length > 250 && (
                      <button 
                        className="view-full-btn"
                        onClick={(e) => { e.stopPropagation(); setShowFullOutput(true); }}
                      >
                        View full response →
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="output-placeholder">
                    Output will be generated based on query
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="node-footer">
          <div className="footer-handle">
            <span className="footer-handle-label">Output</span>
          </div>
        </div>
      </div>

      {showFullOutput && displayOutput && (
        <div 
          className="output-modal-overlay" 
          onClick={() => setShowFullOutput(false)}
        >
          <div 
            className="output-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="output-modal-header">
              <h3>📤 Full Output</h3>
              <div className="output-modal-actions">
                <button 
                  className="modal-btn"
                  onClick={handleCopy}
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button 
                  className="modal-btn danger"
                  onClick={handleClear}
                >
                  🗑️ Clear
                </button>
                <button 
                  className="modal-close"
                  onClick={() => setShowFullOutput(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="output-modal-body">
              <pre>{displayOutput}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OutputNode;