export type NodeStatus = 
  | 'idle' 
  | 'pending' 
  | 'running' 
  | 'success' 
  | 'error' 
  | 'skipped';

export type ExecutionStatus = 
  | 'idle' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface NodeExecutionState {
  nodeId: string;
  status: NodeStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs?: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  nodeId?: string;
  data?: any;
}

export interface EdgeExecutionState {
  edgeId: string;
  status: 'idle' | 'active' | 'completed';
  dataTransferred?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  nodeStates: Record<string, NodeExecutionState>;
  edgeStates: Record<string, EdgeExecutionState>;
  logs: ExecutionLog[];
  result?: any;
  error?: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
    currentNode?: string;
  };
}

export interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  order: number;
}