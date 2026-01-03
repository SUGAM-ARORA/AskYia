import React, { useState } from 'react';
import useExecutionLogs from '../../hooks/useExecutionLogs';
import LogViewer from './logViewer';
import ProgressIndicator from './ProgressIndicator';
import { LogEntry, LogFilter } from '../../services/logService';
import './executionLogs.css';

interface ExecutionLogsProps {
  executionId: string | null;
  onNodeSelect?: (nodeId: string) => void;
}

const executionLogs: React.FC<ExecutionLogsProps> = ({ executionId, onNodeSelect }) => {
  const [filter, setFilter] = useState<LogFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    logs,
    status,
    isConnected,
    isLoading,
    error,
    progress,
    currentNode,
    clearLogs,
    retryConnection,
    applyFilter,
    downloadLogs,
  } = useExecutionLogs(executionId, { filter });

  const handleFilterChange = (key: keyof LogFilter, value: string) => {
    const newFilter = { ...filter, [key]: value || undefined };
    setFilter(newFilter);
    applyFilter(newFilter);
  };

  const handleLogClick = (log: LogEntry) => {
    if (log.node_id && onNodeSelect) {
      onNodeSelect(log.node_id);
    }
  };

  if (!executionId) {
    return (
      <div className="execution-logs-empty">
        <div className="empty-icon">📋</div>
        <p>No workflow execution selected</p>
        <span>Execute a workflow to see logs here</span>
      </div>
    );
  }

  return (
    <div className="execution-logs">
      {/* Header */}
      <div className="execution-logs-header">
        <h3>Execution Logs</h3>
        <div className="header-actions">
          <div className="connection-status">
            <span
              className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}
            />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
          <button
            className="icon-btn"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            🔍
          </button>
          <button className="icon-btn" onClick={downloadLogs} title="Download logs">
            📥
          </button>
          <button className="icon-btn" onClick={clearLogs} title="Clear logs">
            🗑️
          </button>
          {!isConnected && (
            <button className="retry-btn" onClick={retryConnection}>
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {status && (
        <ProgressIndicator
          progress={progress}
          completedNodes={status.progress.completed_nodes}
          totalNodes={status.progress.total_nodes}
          currentNode={currentNode}
          status={status.status}
          startedAt={status.started_at}
          endedAt={status.ended_at}
        />
      )}

      {/* Filters */}
      {showFilters && (
        <div className="log-filters">
          <div className="filter-group">
            <label>Level</label>
            <select
              value={filter.level || ''}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={filter.searchText || ''}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Node ID</label>
            <input
              type="text"
              placeholder="Filter by node..."
              value={filter.nodeId || ''}
              onChange={(e) => handleFilterChange('nodeId', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={retryConnection}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && logs.length === 0 && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Connecting to log stream...</span>
        </div>
      )}

      {/* Log Viewer */}
      <LogViewer
        logs={logs}
        autoScroll={true}
        showTimestamp={true}
        showNodeInfo={true}
        maxHeight="500px"
        onLogClick={handleLogClick}
        highlightNodeId={currentNode || undefined}
      />

      {/* Footer Stats */}
      <div className="execution-logs-footer">
        <span>{logs.length} log entries</span>
        {filter.level && <span className="active-filter">Filtered by: {filter.level}</span>}
      </div>
    </div>
  );
};

export default executionLogs;