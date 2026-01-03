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
  metadata?: Record<string, string | number | boolean | object>;
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
  level?: LogEntry['level'];
  nodeId?: string;
  searchText?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: ExecutionStatus['status'];
  created_at: string;
  updated_at: string;
  user_id?: string;
}