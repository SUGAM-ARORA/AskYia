import { api } from "./api";
import { WorkflowDefinition } from "../types/workflow.types";

export const validateWorkflow = async (definition: WorkflowDefinition) => {
  const { data } = await api.post("/workflows/validate", { definition });
  return data;
};

export const executeWorkflow = async (
  definition: WorkflowDefinition | any,
  query: string,
  prompt?: string,
  web_search?: boolean
) => {
  try {
    const { data } = await api.post("/workflows/execute", { 
      definition, 
      query, 
      prompt, 
      web_search 
    });
    
    // Handle different response structures
    if (data.result) {
      return data.result;
    }
    return data;
  } catch (error: any) {
    console.error("Workflow execution failed:", error);
    
    // Extract error message
    const message = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    error.message || 
                    'Workflow execution failed';
    
    throw new Error(message);
  }
};