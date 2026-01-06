import { create } from "zustand";
import {
  NodeStatus,
  NodeExecutionState,
  EdgeExecutionState,
  WorkflowExecution,
  ExecutionLog
} from "../types/execution.types";
import { v4 as uuidv4 } from "uuid";

interface ExecutionState {
  // Current execution
  currentExecution: WorkflowExecution | null;
  isExecuting: boolean;
  
  // ✅ Final output from backend
  finalOutput: string | null;

  // Execution history
  executionHistory: WorkflowExecution[];

  // UI state
  showExecutionPanel: boolean;
  selectedExecutionId: string | null;

  // Actions
  startExecution: (workflowId: string, nodeIds: string[], edgeIds: string[]) => string;
  updateNodeStatus: (nodeId: string, status: NodeStatus, data?: Partial<NodeExecutionState>) => void;
  updateEdgeStatus: (edgeId: string, status: EdgeExecutionState['status']) => void;
  addLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => void;
  completeExecution: (result?: any, error?: string) => void;
  cancelExecution: () => void;
  resetExecution: () => void;
  setFinalOutput: (output: string | null) => void;
  clearOutput: () => void;

  // UI Actions
  toggleExecutionPanel: () => void;
  setShowExecutionPanel: (show: boolean) => void;
  selectExecution: (executionId: string | null) => void;
  clearHistory: () => void;
  clearCurrentExecution: () => void;
  clearAll: () => void;

  // Getters
  getNodeStatus: (nodeId: string) => NodeStatus;
  getEdgeStatus: (edgeId: string) => EdgeExecutionState['status'];
  getCurrentNodeId: () => string | null;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  currentExecution: null,
  isExecuting: false,
  finalOutput: null,
  executionHistory: [],
  showExecutionPanel: false,
  selectedExecutionId: null,

  startExecution: (workflowId: string, nodeIds: string[], edgeIds: string[]) => {
    const executionId = uuidv4();

    const nodeStates: Record<string, NodeExecutionState> = {};
    nodeIds.forEach(id => {
      nodeStates[id] = { nodeId: id, status: 'pending' };
    });

    const edgeStates: Record<string, EdgeExecutionState> = {};
    edgeIds.forEach(id => {
      edgeStates[id] = { edgeId: id, status: 'idle' };
    });

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      nodeStates,
      edgeStates,
      logs: [],
      progress: {
        completed: 0,
        total: nodeIds.length,
        percentage: 0,
      },
    };

    set({
      currentExecution: execution,
      isExecuting: true,
      showExecutionPanel: true,
      finalOutput: null,
    });

    return executionId;
  },

  setFinalOutput: (output: string | null) => {
    set({ finalOutput: output });
  },

  clearOutput: () => {
    set({ finalOutput: null });
  },

  updateNodeStatus: (nodeId: string, status: NodeStatus, data?: Partial<NodeExecutionState>) => {
    set((state) => {
      if (!state.currentExecution) return state;

      const nodeState = state.currentExecution.nodeStates[nodeId] || { nodeId, status: 'idle' };
      const updatedNodeState: NodeExecutionState = {
        ...nodeState,
        status,
        ...data,
      };

      if (status === 'running' && !nodeState.startTime) {
        updatedNodeState.startTime = Date.now();
      }

      if ((status === 'success' || status === 'error') && nodeState.startTime) {
        updatedNodeState.endTime = Date.now();
        updatedNodeState.duration = updatedNodeState.endTime - nodeState.startTime;
      }

      const newNodeStates = {
        ...state.currentExecution.nodeStates,
        [nodeId]: updatedNodeState,
      };

      const completedCount = Object.values(newNodeStates).filter(
        n => n.status === 'success' || n.status === 'error' || n.status === 'skipped'
      ).length;

      const currentNode = status === 'running' ? nodeId :
        Object.entries(newNodeStates).find(([_, n]) => n.status === 'running')?.[0];

      return {
        currentExecution: {
          ...state.currentExecution,
          nodeStates: newNodeStates,
          progress: {
            completed: completedCount,
            total: Object.keys(newNodeStates).length,
            percentage: Math.round((completedCount / Object.keys(newNodeStates).length) * 100),
            currentNode,
          },
        },
      };
    });
  },

  updateEdgeStatus: (edgeId: string, status: EdgeExecutionState['status']) => {
    set((state) => {
      if (!state.currentExecution) return state;

      return {
        currentExecution: {
          ...state.currentExecution,
          edgeStates: {
            ...state.currentExecution.edgeStates,
            [edgeId]: {
              edgeId,
              status,
              dataTransferred: status === 'completed',
            },
          },
        },
      };
    });
  },

  addLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    set((state) => {
      if (!state.currentExecution) return state;

      const newLog: ExecutionLog = {
        ...log,
        id: uuidv4(),
        timestamp: Date.now(),
      };

      return {
        currentExecution: {
          ...state.currentExecution,
          logs: [...state.currentExecution.logs, newLog],
        },
      };
    });
  },

  completeExecution: (result?: any, error?: string) => {
    set((state) => {
      if (!state.currentExecution) return state;

      const completedExecution: WorkflowExecution = {
        ...state.currentExecution,
        status: error ? 'failed' : 'completed',
        endTime: Date.now(),
        duration: Date.now() - state.currentExecution.startTime,
        result,
        error,
        progress: {
          ...state.currentExecution.progress,
          percentage: 100,
          currentNode: undefined,
        },
      };

      return {
        currentExecution: completedExecution,
        isExecuting: false,
        executionHistory: [completedExecution, ...state.executionHistory].slice(0, 20),
      };
    });
  },

  cancelExecution: () => {
    set((state) => {
      if (!state.currentExecution) return state;

      const cancelledExecution: WorkflowExecution = {
        ...state.currentExecution,
        status: 'cancelled',
        endTime: Date.now(),
        duration: Date.now() - state.currentExecution.startTime,
      };

      return {
        currentExecution: cancelledExecution,
        isExecuting: false,
        finalOutput: null,
        executionHistory: [cancelledExecution, ...state.executionHistory].slice(0, 20),
      };
    });
  },

  resetExecution: () => {
    set({
      currentExecution: null,
      isExecuting: false,
      finalOutput: null,
    });
  },
  clearCurrentExecution: () => {
    set({
      currentExecution: null,
      isExecuting: false,
      finalOutput: null,
    });
  },
  clearHistory: () => {
    set({ executionHistory: [] });
  },

  clearAll: () => {
    set({
      currentExecution: null,
      isExecuting: false,
      finalOutput: null,
      executionHistory: [],
      showExecutionPanel: false,
      selectedExecutionId: null,
    });
  },

  toggleExecutionPanel: () => {
    set((state) => ({ showExecutionPanel: !state.showExecutionPanel }));
  },

  setShowExecutionPanel: (show: boolean) => {
    set({ showExecutionPanel: show });
  },

  selectExecution: (executionId: string | null) => {
    set({ selectedExecutionId: executionId });
  },

  getNodeStatus: (nodeId: string) => {
    const state = get();
    return state.currentExecution?.nodeStates[nodeId]?.status || 'idle';
  },

  getEdgeStatus: (edgeId: string) => {
    const state = get();
    return state.currentExecution?.edgeStates[edgeId]?.status || 'idle';
  },

  getCurrentNodeId: () => {
    const state = get();
    return state.currentExecution?.progress.currentNode || null;
  },
}));