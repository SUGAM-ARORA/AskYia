import { api } from "./api";
import { WorkflowDefinition } from "../types/workflow.types";

export const askWorkflow = async (
  definition: WorkflowDefinition,
  query: string,
  prompt?: string,
  web_search?: boolean
) => {
  const { data } = await api.post("/chat/ask", { workflow_definition: definition, query, prompt, web_search });
  return data.answer;
};
