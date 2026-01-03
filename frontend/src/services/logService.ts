// import { EventSourcePolyfill } from 'event-source-polyfill';
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  workflow_id: string;
  execution_id: string;
  node_id?: string;
  node_type?: string;
  step?: number;
  total_steps?: number;
  progress?: number;
  metadata?: Record<string, string | number | boolean | null | object>;
}

export interface ExecutionStatus {
  execution_id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  ended_at?: string;
  progress: {
    completed_nodes: number;
    total_nodes: number;
    percentage: number;
    current_node?: string;
  };
  error?: string;
}

export interface LogFilter {
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  nodeId?: string;
  searchText?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class LogServiceClass {
  private eventSource: EventSource | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  async getExecutionLogs(
    executionId: string,
    options?: {
      limit?: number;
      offset?: number;
      level?: string;
    }
  ): Promise<{ logs: LogEntry[]; total: number; offset: number; limit: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.level) params.append('level', options.level);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/logs/executions/${executionId}/logs?${params}`,
      {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch logs' }));
      throw new Error(error.detail || 'Failed to fetch logs');
    }

    return response.json();
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/logs/executions/${executionId}/status`,
      {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch status' }));
      throw new Error(error.detail || 'Failed to fetch execution status');
    }

    return response.json();
  }

  subscribeToLogs(
    executionId: string,
    callbacks: {
      onLog: (log: LogEntry) => void;
      onComplete: (data: { status: string; duration_seconds?: number }) => void;
      onError: (error: Error) => void;
      onHeartbeat?: () => void;
      onConnectionChange?: (connected: boolean) => void;
    }
  ): () => void {
    const url = `${API_BASE_URL}/api/v1/logs/executions/${executionId}/stream`;

    const connect = () => {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.reconnectAttempts = 0;
        callbacks.onConnectionChange?.(true);
      };

      this.eventSource.addEventListener('log', (event) => {
        try {
          const log = JSON.parse((event as MessageEvent).data) as LogEntry;
          callbacks.onLog(log);
        } catch (e) {
          console.error('Failed to parse log event:', e);
        }
      });

      this.eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          callbacks.onComplete(data);
          this.disconnect();
        } catch (e) {
          console.error('Failed to parse complete event:', e);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        callbacks.onHeartbeat?.();
      });

      this.eventSource.addEventListener('error', (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          callbacks.onError(new Error(data.error || 'Stream error'));
        } catch (e) {
          // Connection error, attempt reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            callbacks.onConnectionChange?.(false);
            setTimeout(connect, this.reconnectDelay * this.reconnectAttempts);
          } else {
            callbacks.onError(new Error('Connection lost. Max reconnect attempts reached.'));
          }
        }
      });

      this.eventSource.onerror = () => {
        callbacks.onConnectionChange?.(false);
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(connect, this.reconnectDelay * this.reconnectAttempts);
          }
        }
      };
    };

    connect();

    // Return cleanup function
    return () => this.disconnect();
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempts = 0;
  }

  filterLogs(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter((log) => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.nodeId && log.node_id !== filter.nodeId) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const matchesMessage = log.message.toLowerCase().includes(searchLower);
        const matchesNodeId = log.node_id?.toLowerCase().includes(searchLower);
        if (!matchesMessage && !matchesNodeId) return false;
      }
      return true;
    });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  getLevelColor(level: LogEntry['level']): string {
    const colors: Record<LogEntry['level'], string> = {
      DEBUG: '#6B7280',
      INFO: '#3B82F6',
      WARNING: '#F59E0B',
      ERROR: '#EF4444',
      CRITICAL: '#DC2626',
    };
    return colors[level];
  }
}

export const logService = new LogServiceClass();
export default logService;