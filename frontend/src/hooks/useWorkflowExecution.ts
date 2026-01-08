import { useCallback, useRef } from "react";
import { Node, Edge } from "reactflow";
import { useExecutionStore } from "../store/executionSlice";
import { useApiKeysStore } from "../store/apiKeysSlice";
import { executeWorkflow } from "../services/workflowService";

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
    setFinalOutput,
    clearOutput,
  } = useExecutionStore();

  const { getApiKey } = useApiKeysStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get execution order from nodes and edges (topological sort)
  const getExecutionOrder = useCallback((nodes: Node[], edges: Edge[]): string[] => {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    });

    edges.forEach(edge => {
      const targets = adjacency.get(edge.source) || [];
      targets.push(edge.target);
      adjacency.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

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

  // Build workflow definition from nodes and edges
  const buildWorkflowDefinition = useCallback((nodes: Node[], edges: Edge[]) => {
    const executionOrder = getExecutionOrder(nodes, edges);

    const llmNodes = nodes.filter(n => n.type === 'llm' || n.type === 'llmEngine');

    return {
      id: `workflow-${Date.now()}`,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: n.data,
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
      executionOrder,
      llmConfig: llmNodes[0]?.data || {},
    };
  }, [getExecutionOrder]);

  // Extract query from input node - handles multiple node types
  const getQueryFromNodes = useCallback((nodes: Node[]): string => {
    // Look for various input node types
    const inputNode = nodes.find(n =>
      n.type === 'input' ||
      n.type === 'userQuery' ||
      n.type === 'user_query' ||
      n.type === 'UserQuery' ||
      n.data?.nodeType === 'user_query' ||
      n.data?.label?.toLowerCase().includes('query') ||
      n.data?.label?.toLowerCase().includes('input')
    );

    if (!inputNode) {
      console.warn('No input node found in workflow');
      return '';
    }

    // Try multiple possible field names for the query
    const query = 
      inputNode.data?.query || 
      inputNode.data?.userQuery || 
      inputNode.data?.value ||
      inputNode.data?.input ||
      inputNode.data?.defaultValue ||
      inputNode.data?.text ||
      '';

    console.log('Extracted query from node:', { 
      nodeId: inputNode.id,
      nodeType: inputNode.type, 
      nodeLabel: inputNode.data?.label,
      query: query?.substring(0, 50) + (query?.length > 50 ? '...' : '')
    });

    return query;
  }, []);

  // Extract prompt/system prompt from LLM nodes
  const getPromptFromNodes = useCallback((nodes: Node[]): string | undefined => {
    const llmNode = nodes.find(n =>
      n.type === 'llm' ||
      n.type === 'llmEngine' ||
      n.type === 'llm_engine'
    );
    return llmNode?.data?.systemPrompt || llmNode?.data?.prompt;
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

    // Clear previous output before starting new execution
    clearOutput();

    abortControllerRef.current = new AbortController();

    const nodeIds = nodes.map(n => n.id);
    const edgeIds = edges.map(e => e.id);
    const executionId = startExecution("workflow", nodeIds, edgeIds);

    addLog({ level: 'info', message: `Starting workflow execution: ${executionId}` });
    addLog({ level: 'info', message: `Query: ${query}` });

    try {
      const definition = buildWorkflowDefinition(nodes, edges);
      const executionOrder = getExecutionOrder(nodes, edges);

      // Get query from parameter first, then try to extract from nodes
      const actualQuery = query || getQueryFromNodes(nodes);
      const prompt = getPromptFromNodes(nodes);

      if (!actualQuery) {
        throw new Error('No query provided. Please enter a query in the User Query node.');
      }

      addLog({ level: 'debug', message: `Execution order: ${executionOrder.join(' → ')}` });
      addLog({ level: 'info', message: `Query being sent: "${actualQuery.substring(0, 100)}${actualQuery.length > 100 ? '...' : ''}"` });
      addLog({ level: 'info', message: `Sending to backend API...` });

      // Log Knowledge Base status
      const kbNode = nodes.find(n => n.type === 'knowledgeBase' || n.type === 'knowledge_base');
      if (kbNode) {
        const kbEnabled = kbNode.data?.enabled !== false;
        const topK = kbNode.data?.topK || 3;
        const threshold = kbNode.data?.threshold || 0.7;
        addLog({ 
          level: 'debug', 
          message: `Knowledge Base: enabled=${kbEnabled}, topK=${topK}, threshold=${(threshold * 100).toFixed(0)}%` 
        });
      }

      // Animate nodes while waiting for backend
      const animationPromise = (async () => {
        for (let i = 0; i < executionOrder.length; i++) {
          const nodeId = executionOrder[i];
          const node = nodes.find(n => n.id === nodeId);
          if (!node) continue;

          options?.onNodeStart?.(nodeId);

          const incomingEdges = edges.filter(e => e.target === nodeId);
          for (const edge of incomingEdges) {
            updateEdgeStatus(edge.id, 'active');
          }

          updateNodeStatus(nodeId, 'running');
          addLog({ level: 'info', message: `Executing: ${node.data?.label || node.type}`, nodeId });

          // Different delays based on node type
          let delay = 500;
          if (node.type === 'llm' || node.type === 'llmEngine') {
            delay = 2000;
          } else if (node.type === 'knowledgeBase' || node.type === 'knowledge_base') {
            delay = 1000;
          }
          await new Promise(r => setTimeout(r, delay));
        }
      })();

      // Call real backend API
      const backendPromise = executeWorkflow(
        definition,
        actualQuery,
        prompt,
        false
      );

      const [_, backendResult] = await Promise.all([
        animationPromise,
        backendPromise
      ]);

      addLog({ level: 'info', message: `Backend response received` });
      
      // Log execution metadata if available
      if (backendResult?._execution) {
        const exec = backendResult._execution;
        addLog({ 
          level: 'debug', 
          message: `Execution completed in ${exec.duration_seconds}s, KB used: ${exec.kb_used}, context length: ${exec.context_length}` 
        });
      }

      // Mark all nodes as complete
      for (const nodeId of executionOrder) {
        const incomingEdges = edges.filter(e => e.target === nodeId);
        for (const edge of incomingEdges) {
          updateEdgeStatus(edge.id, 'completed');
        }

        updateNodeStatus(nodeId, 'success', {
          output: nodeId === executionOrder[executionOrder.length - 1]
            ? backendResult
            : { processed: true }
        });
        options?.onNodeComplete?.(nodeId, backendResult);
      }

      // Extract and store final output
      const finalAnswer = backendResult?.answer ||
                          backendResult?.result?.answer ||
                          backendResult?.output ||
                          (typeof backendResult === 'string' ? backendResult : JSON.stringify(backendResult));

      setFinalOutput(finalAnswer);
      completeExecution({ answer: finalAnswer, raw: backendResult });
      addLog({ level: 'info', message: 'Workflow execution completed successfully' });

      options?.onComplete?.({ answer: finalAnswer, raw: backendResult });

      return { answer: finalAnswer, raw: backendResult };

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';

      const executionOrder = getExecutionOrder(nodes, edges);
      for (const nodeId of executionOrder) {
        const state = useExecutionStore.getState();
        if (state.currentExecution?.nodeStates[nodeId]?.status === 'running') {
          updateNodeStatus(nodeId, 'error', { error: errorMessage });
        }
      }

      completeExecution(undefined, errorMessage);
      addLog({ level: 'error', message: `Workflow execution failed: ${errorMessage}` });
      options?.onError?.(errorMessage);

      return { error: errorMessage };
    }
  }, [
    isExecuting,
    startExecution,
    updateNodeStatus,
    updateEdgeStatus,
    addLog,
    completeExecution,
    setFinalOutput,
    clearOutput,
    buildWorkflowDefinition,
    getExecutionOrder,
    getQueryFromNodes,
    getPromptFromNodes,
  ]);

  // Cancel execution
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelExecution();
  }, [cancelExecution]);

  return {
    execute,
    cancel,
    isExecuting,
    currentExecution,
  };
};

export default useWorkflowExecution;