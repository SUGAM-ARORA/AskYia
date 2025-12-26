import { Node, Edge } from "reactflow";

export interface WorkflowDefinition {
  nodes: Node[];
  edges: Edge[];
  knowledge_base_enabled?: boolean;
}
