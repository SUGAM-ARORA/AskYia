import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../../services/logService';
import logService from '../../services/logService';
import './LogViewer.css';

interface LogViewerProps {
  logs: LogEntry[];
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showNodeInfo?: boolean;
  maxHeight?: string;
  onLogClick?: (log: LogEntry) => void;
  highlightNodeId?: string;
}

const logViewer: React.FC<LogViewerProps> = ({
  logs,
  autoScroll = true,
  showTimestamp = true,
  showNodeInfo = true,
  maxHeight = '400px',
  onLogClick,
  highlightNodeId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !userScrolled && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, userScrolled]);

  // Detect user scroll
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserScrolled(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUserScrolled(false);
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG':
        return '🔍';
      case 'INFO':
        return 'ℹ️';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'CRITICAL':
        return '🔴';
      default:
        return '📝';
    }
  };

  return (
    <div className="log-viewer-container">
      <div
        ref={containerRef}
        className="log-viewer"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="log-empty">
            <span>No logs yet. Waiting for execution...</span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`log-entry log-level-${log.level.toLowerCase()} ${
                highlightNodeId && log.node_id === highlightNodeId ? 'highlighted' : ''
              }`}
              onClick={() => onLogClick?.(log)}
              style={{ cursor: onLogClick ? 'pointer' : 'default' }}
            >
              {showTimestamp && (
                <span className="log-timestamp">
                  {logService.formatTimestamp(log.timestamp)}
                </span>
              )}
              <span
                className="log-level"
                style={{ color: logService.getLevelColor(log.level) }}
              >
                {getLevelIcon(log.level)} {log.level}
              </span>
              {showNodeInfo && log.node_id && (
                <span className="log-node">
                  [{log.node_type}:{log.node_id.slice(0, 8)}]
                </span>
              )}
              <span className="log-message">{log.message}</span>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="log-metadata">
                  <summary>Details</summary>
                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      {userScrolled && (
        <button className="scroll-to-bottom-btn" onClick={scrollToBottom}>
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  );
};

export default logViewer;