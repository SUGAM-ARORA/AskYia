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
  provider?: string;  // Added: "gemini" | "openai"
  model?: string;
  apiKey?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;  // Added
  webSearch?: boolean;
  serpApiKey?: string;
}

export interface KnowledgeBaseNodeData extends NodeData {
  file?: File | string | null;
  embeddingModel?: string;
  apiKey?: string;
}

export interface WebSearchNodeData extends NodeData {
  apiKey?: string;
  maxResults?: number;
}

export interface OutputNodeData extends NodeData {
  output?: string;
}