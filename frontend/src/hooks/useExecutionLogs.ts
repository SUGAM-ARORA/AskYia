import { useState, useEffect, useCallback, useRef } from 'react';
// import logService, { LogEntry, ExecutionStatus, LogFilter } from '../services/logService';
import logService, { LogEntry, ExecutionStatus, LogFilter } from "../services/logService";

interface UseExecutionLogsOptions {
  autoScroll?: boolean;
  maxLogs?: number;
  filter?: LogFilter;
}

interface UseExecutionLogsReturn {
  logs: LogEntry[];
  status: ExecutionStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  currentNode: string | null;
  clearLogs: () => void;
  retryConnection: () => void;
  applyFilter: (filter: LogFilter) => void;
  downloadLogs: () => void;
}

export function useExecutionLogs(
  executionId: string | null,
  options: UseExecutionLogsOptions = {}
): UseExecutionLogsReturn {
  const { autoScroll = true, maxLogs = 1000, filter: initialFilter } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogFilter>(initialFilter || {});

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Apply filter whenever logs or filter changes
  useEffect(() => {
    if (Object.keys(filter).length > 0) {
      setFilteredLogs(logService.filterLogs(logs, filter));
    } else {
      setFilteredLogs(logs);
    }
  }, [logs, filter]);

  // Subscribe to logs when executionId changes
  useEffect(() => {
    if (!executionId) {
      setLogs([]);
      setStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Fetch initial status
    logService
      .getExecutionStatus(executionId)
      .then(setStatus)
      .catch((err) => console.error('Failed to fetch initial status:', err));

    // Subscribe to real-time logs
    unsubscribeRef.current = logService.subscribeToLogs(executionId, {
      onLog: (log) => {
        setLogs((prev) => {
          const newLogs = [...prev, log];
          // Keep only the last maxLogs entries
          if (newLogs.length > maxLogs) {
            return newLogs.slice(-maxLogs);
          }
          return newLogs;
        });
        setIsLoading(false);
      },
      onComplete: (data) => {
        setStatus((prev) =>
          prev ? { ...prev, status: data.status as ExecutionStatus['status'] } : null
        );
        setIsConnected(false);
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      onHeartbeat: () => {
        // Connection is alive
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
        if (connected) {
          setError(null);
        }
      },
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [executionId, maxLogs]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setFilteredLogs([]);
  }, []);

  const retryConnection = useCallback(() => {
    if (executionId) {
      unsubscribeRef.current?.();
      setError(null);
      setIsLoading(true);

      unsubscribeRef.current = logService.subscribeToLogs(executionId, {
        onLog: (log) => {
          setLogs((prev) => [...prev, log].slice(-maxLogs));
          setIsLoading(false);
        },
        onComplete: (data) => {
          setStatus((prev) =>
            prev ? { ...prev, status: data.status as ExecutionStatus['status'] } : null
          );
        },
        onError: (err) => {
          setError(err.message);
          setIsLoading(false);
        },
        onConnectionChange: setIsConnected,
      });
    }
  }, [executionId, maxLogs]);

  const applyFilter = useCallback((newFilter: LogFilter) => {
    setFilter(newFilter);
  }, []);

  const downloadLogs = useCallback(() => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level}] ${log.node_id ? `[${log.node_id}] ` : ''}${log.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs, executionId]);

  const progress = status?.progress.percentage || 0;
  const currentNode = status?.progress.current_node || null;

  return {
    logs: filteredLogs,
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
  };
}

export default useExecutionLogs;