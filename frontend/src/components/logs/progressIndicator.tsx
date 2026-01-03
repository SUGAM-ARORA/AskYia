import React from 'react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  progress: number;
  completedNodes: number;
  totalNodes: number;
  currentNode?: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  endedAt?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  completedNodes,
  totalNodes,
  currentNode,
  status,
  startedAt,
  endedAt,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return '#6b7280';
      case 'running':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'cancelled':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const formatDuration = () => {
    if (!startedAt) return null;
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <div className="progress-status" style={{ color: getStatusColor() }}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
        <div className="progress-stats">
          <span className="node-count">
            {completedNodes} / {totalNodes} nodes
          </span>
          {startedAt && <span className="duration">⏱️ {formatDuration()}</span>}
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: getStatusColor(),
          }}
        />
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>

      {currentNode && status === 'running' && (
        <div className="current-node">
          <span className="current-node-label">Currently executing:</span>
          <span className="current-node-id">{currentNode}</span>
          <span className="executing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;