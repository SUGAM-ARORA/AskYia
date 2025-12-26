import { api } from "./api";
import { WorkflowDefinition } from "../types/workflow.types";

export const validateWorkflow = async (definition: WorkflowDefinition) => {
  const { data } = await api.post("/workflows/validate", { definition });
  return data;
};

export const executeWorkflow = async (
  definition: WorkflowDefinition,
  query: string,
  prompt?: string,
  web_search?: boolean
) => {
  const { data } = await api.post("/workflows/execute", { definition, query, prompt, web_search });
  return data.result;
};
