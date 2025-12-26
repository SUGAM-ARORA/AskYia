import { useWorkflowStore } from "../store/workflowSlice";
import { WorkflowDefinition } from "../types/workflow.types";

export const useWorkflow = () => {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  const getDefinition = (): WorkflowDefinition => ({ nodes, edges, knowledge_base_enabled: true });

  return { nodes, edges, setNodes, setEdges, getDefinition };
};
