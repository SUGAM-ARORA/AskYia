import { useMemo } from 'react';
import { useExecutionStore } from '../../store/executionSlice';
import { NodeStatus } from '../../types/execution.types';
import '../../styles/Execution.css';

interface ExecutionPanelProps {
  onClose: () => void;
}

const ExecutionPanel = ({ onClose }: ExecutionPanelProps) => {
  const { 
    currentExecution, 
    isExecuting,
    executionHistory,
    finalOutput,
    clearCurrentExecution,
    clearHistory,
    clearAll,
    clearOutput,
  } = useExecutionStore();

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = (status: NodeStatus | string) => {
    switch (status) {
      case 'idle': return '⚪';
      case 'pending': return '🟡';
      case 'running': return '🔵';
      case 'success': 
      case 'completed': return '🟢';
      case 'error': 
      case 'failed': return '🔴';
      case 'skipped': return '⚫';
      case 'cancelled': return '🟠';
      default: return '⚪';
    }
  };

  const getStatusLabel = (status: NodeStatus | string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const nodeStates = useMemo(() => {
    if (!currentExecution) return [];
    return Object.values(currentExecution.nodeStates).sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime - b.startTime;
      return 0;
    });
  }, [currentExecution]);

  const logs = useMemo(() => {
    if (!currentExecution) return [];
    return [...currentExecution.logs].reverse().slice(0, 50);
  }, [currentExecution]);

  // Handle clear actions
  const handleReset = () => {
    if (!isExecuting) {
      clearCurrentExecution();
    }
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  const handleClearAll = () => {
    if (!isExecuting) {
      clearAll();
      onClose();
    }
  };

  return (
    <div className="execution-panel">
      <div className="execution-panel-header">
        <h3>⚡ Execution</h3>
        <div className="panel-header-actions">
          <button 
            className="panel-action-btn reset"
            onClick={handleReset}
            disabled={isExecuting}
            title="Reset current execution"
          >
            🔄
          </button>
          <button 
            className="panel-action-btn"
            onClick={handleClearHistory}
            title="Clear history"
          >
            🗑️
          </button>
          <button 
            className="panel-action-btn danger"
            onClick={handleClearAll}
            disabled={isExecuting}
            title="Clear all"
          >
            ❌
          </button>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {currentExecution ? (
        <>
          {/* Progress Section */}
          <div className="execution-progress-section">
            <div className="progress-header">
              <span className="progress-status">
                {getStatusIcon(currentExecution.status)} {getStatusLabel(currentExecution.status)}
              </span>
              <span className="progress-time">
                {currentExecution.duration 
                  ? formatDuration(currentExecution.duration)
                  : formatDuration(Date.now() - currentExecution.startTime)
                }
              </span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className={`progress-bar ${currentExecution.status}`}
                style={{ width: `${currentExecution.progress.percentage}%` }}
              />
            </div>
            
            <div className="progress-stats">
              <span>{currentExecution.progress.completed} / {currentExecution.progress.total} nodes</span>
              <span>{currentExecution.progress.percentage}%</span>
            </div>
          </div>

          {/* Current Node */}
          {currentExecution.progress.currentNode && isExecuting && (
            <div className="current-node-section">
              <span className="current-node-label">Currently executing:</span>
              <span className="current-node-id">
                <span className="running-indicator"></span>
                {currentExecution.progress.currentNode}
              </span>
            </div>
          )}
          {finalOutput && !isExecuting && (
            <div className="output-preview-section">
              <div className="output-preview-header">
                <h4>📤 Output</h4>
                <button 
                  className="output-clear-btn"
                  onClick={() => clearOutput()}
                  title="Clear output"
                >
                  🗑️
                </button>
              </div>
              <div className="output-preview-content">
                {finalOutput.length > 200 
                  ? finalOutput.slice(0, 200) + '...' 
                  : finalOutput
                }
              </div>
            </div>
          )}

          {/* Node States */}
          <div className="node-states-section">
            <h4>Node Execution</h4>
            <div className="node-states-list">
              {nodeStates.map((state) => (
                <div key={state.nodeId} className={`node-state-item ${state.status}`}>
                  <span className="node-state-icon">{getStatusIcon(state.status)}</span>
                  <span className="node-state-id">{state.nodeId.slice(0, 8)}...</span>
                  <span className="node-state-status">{getStatusLabel(state.status)}</span>
                  {state.duration && (
                    <span className="node-state-duration">{formatDuration(state.duration)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logs Section */}
          <div className="logs-section">
            <h4>Logs</h4>
            <div className="logs-list">
              {logs.map((log) => (
                <div key={log.id} className={`log-entry ${log.level}`}>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="logs-empty">No logs yet</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="execution-empty">
          <div className="empty-icon">⚡</div>
          <p>No active execution</p>
          <span>Click "Build Stack" to run your workflow</span>
        </div>
      )}

      {/* History Section */}
      {executionHistory.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h4>Recent Executions</h4>
            <button 
              className="history-clear-btn"
              onClick={handleClearHistory}
              title="Clear history"
            >
              Clear
            </button>
          </div>
          <div className="history-list">
            {executionHistory.slice(0, 5).map((execution) => (
              <div key={execution.id} className={`history-item ${execution.status}`}>
                <span className="history-icon">{getStatusIcon(execution.status)}</span>
                <span className="history-time">{formatTime(execution.startTime)}</span>
                <span className="history-duration">
                  {execution.duration ? formatDuration(execution.duration) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;