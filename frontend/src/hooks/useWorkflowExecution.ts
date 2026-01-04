import { useCallback, useRef } from "react";
import { Node, Edge } from "reactflow";
import { useExecutionStore } from "../store/executionSlice";
import { useApiKeysStore } from "../store/apiKeysSlice";
import { LLMProvider } from "../types/llm.types";
import { api } from "../services/api";

interface ExecutionOptions {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, output: any) => void;
}

export const useWorkflowExecution = () => {
  const {
    startExecution,
    updateNodeStatus,
    updateEdgeStatus,
    addLog,
    completeExecution,
    cancelExecution,
    isExecuting,
    currentExecution,
  } = useExecutionStore();
  
  const { getApiKey } = useApiKeysStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get execution order from nodes and edges (topological sort)
  const getExecutionOrder = useCallback((nodes: Node[], edges: Edge[]): string[] => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // Initialize
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    });
    
    // Build graph
    edges.forEach(edge => {
      const targets = adjacency.get(edge.source) || [];
      targets.push(edge.target);
      adjacency.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];
    
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);
      
      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }
    
    return result;
  }, []);

  // Get incoming edges for a node
  const getIncomingEdges = useCallback((nodeId: string, edges: Edge[]): Edge[] => {
    return edges.filter(edge => edge.target === nodeId);
  }, []);

  // Get outgoing edges for a node
  const getOutgoingEdges = useCallback((nodeId: string, edges: Edge[]): Edge[] => {
    return edges.filter(edge => edge.source === nodeId);
  }, []);

  // Simulate node execution with delay
  const executeNode = useCallback(async (
    node: Node,
    inputData: any,
    signal: AbortSignal
  ): Promise<any> => {
    const nodeType = node.type?.toLowerCase();
    const nodeData = node.data || {};
    
    // Simulate processing time based on node type
    const getProcessingTime = () => {
      switch (nodeType) {
        case 'llm': return 1500 + Math.random() * 2000; // 1.5-3.5s for LLM
        case 'knowledge': return 800 + Math.random() * 1200; // 0.8-2s for KB
        case 'websearch': return 1000 + Math.random() * 1500; // 1-2.5s for search
        case 'api': return 500 + Math.random() * 1000; // 0.5-1.5s for API
        case 'transform': return 200 + Math.random() * 300; // 0.2-0.5s for transform
        case 'conditional': return 100 + Math.random() * 200; // 0.1-0.3s for conditional
        case 'validator': return 150 + Math.random() * 250; // 0.15-0.4s for validator
        default: return 300 + Math.random() * 500;
      }
    };
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, getProcessingTime());
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Execution cancelled'));
      });
    });
    
    // Return mock output based on node type
    switch (nodeType) {
      case 'input':
        return { query: inputData?.query || nodeData.query || "User query" };
      case 'llm':
        return { response: `AI response from ${nodeData.provider || 'openai'}/${nodeData.model || 'gpt-4o-mini'}` };
      case 'knowledge':
        return { context: "Retrieved context from knowledge base..." };
      case 'websearch':
        return { results: ["Search result 1", "Search result 2", "Search result 3"] };
      case 'output':
        return { finalOutput: inputData };
      case 'transform':
        return { transformed: inputData };
      case 'conditional':
        return { condition: true, branch: 'true' };
      case 'validator':
        return { valid: true, data: inputData };
      case 'memory':
        return { history: [] };
      case 'api':
        return { response: { status: 200, data: {} } };
      default:
        return inputData;
    }
  }, []);

  // Main execution function
  const execute = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    query: string,
    options?: ExecutionOptions
  ) => {
    if (isExecuting) {
      console.warn("Execution already in progress");
      return;
    }

    // Create abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Start execution
    const nodeIds = nodes.map(n => n.id);
    const edgeIds = edges.map(e => e.id);
    const executionId = startExecution("workflow", nodeIds, edgeIds);

    addLog({ level: 'info', message: `Starting workflow execution: ${executionId}` });
    addLog({ level: 'info', message: `Query: ${query}` });

    try {
      // Get execution order
      const executionOrder = getExecutionOrder(nodes, edges);
      addLog({ level: 'debug', message: `Execution order: ${executionOrder.join(' → ')}` });

      const nodeOutputs: Record<string, any> = {};
      
      // Execute nodes in order
      for (const nodeId of executionOrder) {
        if (signal.aborted) {
          throw new Error('Execution cancelled');
        }

        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Update incoming edges to active
        const incomingEdges = getIncomingEdges(nodeId, edges);
        for (const edge of incomingEdges) {
          updateEdgeStatus(edge.id, 'active');
          await new Promise(r => setTimeout(r, 200)); // Brief animation delay
        }

        // Start node execution
        updateNodeStatus(nodeId, 'running');
        options?.onNodeStart?.(nodeId);
        addLog({ 
          level: 'info', 
          message: `Executing node: ${node.type}`,
          nodeId,
        });

        try {
          // Gather inputs from connected nodes
          const inputs: any = { query };
          for (const edge of incomingEdges) {
            if (nodeOutputs[edge.source]) {
              inputs[edge.sourceHandle || 'default'] = nodeOutputs[edge.source];
            }
          }

          // Execute the node
          const output = await executeNode(node, inputs, signal);
          nodeOutputs[nodeId] = output;

          // Update node and edges as complete
          updateNodeStatus(nodeId, 'success', { output });
          options?.onNodeComplete?.(nodeId, output);
          
          for (const edge of incomingEdges) {
            updateEdgeStatus(edge.id, 'completed');
          }

          addLog({ 
            level: 'info', 
            message: `Node completed successfully`,
            nodeId,
            data: output,
          });

        } catch (nodeError: any) {
          updateNodeStatus(nodeId, 'error', { error: nodeError.message });
          addLog({ 
            level: 'error', 
            message: `Node failed: ${nodeError.message}`,
            nodeId,
          });
          
          if (signal.aborted) {
            throw nodeError;
          }
          
          // Continue execution for non-critical nodes or throw for critical ones
          if (node.type === 'llm' || node.type === 'output') {
            throw nodeError;
          }
        }

        // Small delay between nodes for visual effect
        await new Promise(r => setTimeout(r, 300));
      }

      // Complete execution
      const finalOutput = nodeOutputs[executionOrder[executionOrder.length - 1]];
      completeExecution(finalOutput);
      addLog({ level: 'info', message: 'Workflow execution completed successfully' });
      options?.onComplete?.(finalOutput);

    } catch (error: any) {
      if (error.message === 'Execution cancelled') {
        cancelExecution();
        addLog({ level: 'warning', message: 'Workflow execution cancelled' });
      } else {
        completeExecution(undefined, error.message);
        addLog({ level: 'error', message: `Workflow execution failed: ${error.message}` });
        options?.onError?.(error.message);
      }
    }
  }, [
    isExecuting,
    startExecution,
    updateNodeStatus,
    updateEdgeStatus,
    addLog,
    completeExecution,
    cancelExecution,
    getExecutionOrder,
    getIncomingEdges,
    executeNode,
  ]);

  // Cancel execution
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    execute,
    cancel,
    isExecuting,
    currentExecution,
  };
};

export default useWorkflowExecution;