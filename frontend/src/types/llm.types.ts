export type LLMProvider = 
  | 'openai' 
  | 'google' 
  | 'anthropic' 
  | 'xai' 
  | 'meta' 
  | 'mistral'
  | 'groq'
  | 'cohere';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  contextWindow: number;
  maxOutput?: number;
  inputPricing?: number;  // per 1M tokens
  outputPricing?: number; // per 1M tokens
  capabilities: ModelCapability[];
  description?: string;
  isNew?: boolean;
  isBeta?: boolean;
}

export type ModelCapability = 
  | 'chat'
  | 'completion'
  | 'vision'
  | 'function_calling'
  | 'json_mode'
  | 'streaming'
  | 'embeddings';

export interface ProviderConfig {
  id: LLMProvider;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  apiKeyPlaceholder: string;
  apiKeyPrefix?: string;
  docsUrl: string;
  models: LLMModel[];
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
}