import { LLMProvider } from "./llm.types";

export type NodeKind = "user_query" | "knowledge_base" | "llm_engine" | "output" | "input" | "llm" | "knowledge" | "webSearch";

export interface NodeData {
  label?: string;
  onUpdate?: (updates: Partial<NodeData>) => void;
  [key: string]: any;
}

export interface InputNodeData extends NodeData {
  query?: string;
}

export interface LLMNodeData extends NodeData {
  provider?: LLMProvider;
  model?: string;
  apiKey?: string;
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  webSearch?: boolean;
  serpApiKey?: string;
  useGlobalApiKey?: boolean;
}

export interface KnowledgeBaseNodeData extends NodeData {
  file?: File | string | null;
  embeddingModel?: string;
  embeddingProvider?: LLMProvider;
  apiKey?: string;
}

export interface WebSearchNodeData extends NodeData {
  apiKey?: string;
  maxResults?: number;
  searchEngine?: string;
}

export interface OutputNodeData extends NodeData {
  output?: string;
}