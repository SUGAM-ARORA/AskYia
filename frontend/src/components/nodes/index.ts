// src/components/nodes/index.ts
import { NodeTypes } from "reactflow";

// Existing custom nodes exports
export { default as InputNode } from './InputNode';
export { default as LLMNode } from './LLMNode';
export { default as KnowledgeBaseNode } from './KnowledgeBaseNode';
export { default as WebSearchNode } from './WebSearchNode';
export { default as OutputNode } from './OutputNode';
export { default as ConditionalNode } from './ConditionalNode';
export { default as TransformNode } from './TransformNode';
export { default as APINode } from './APINode';
export { default as MemoryNode } from './MemoryNode';
export { default as ValidatorNode } from './ValidatorNode';

// Import existing nodes
import InputNode from './InputNode';
import LLMNode from './LLMNode';
import KnowledgeBaseNode from './KnowledgeBaseNode';
import WebSearchNode from './WebSearchNode';
import OutputNode from './OutputNode';
import ConditionalNode from './ConditionalNode';
import TransformNode from './TransformNode';
import APINode from './APINode';
import MemoryNode from './MemoryNode';
import ValidatorNode from './ValidatorNode';
import LLMEngineNode from './LLMEngineNode';
import UserQueryNode from './UserQueryNode';

// Import Generic node for new node types
import GenericNode from './GenericNode';

// Node type mapping - combines existing custom nodes with new GenericNode-based nodes
export const nodeTypes: NodeTypes = {
  // ==========================================
  // EXISTING CUSTOM NODES (Original implementations)
  // ==========================================
  
  // Input/Output
  input: InputNode,
  output: OutputNode,
  
  // LLM Nodes
  llm: LLMNode,
  llmEngine: LLMEngineNode,
  llm_engine: LLMEngineNode,
  
  // Knowledge & Search
  knowledgeBase: KnowledgeBaseNode,
  knowledge_base: KnowledgeBaseNode,
  webSearch: WebSearchNode,
  web_search: WebSearchNode,
  
  // Logic & Transform
  conditional: ConditionalNode,
  transform: TransformNode,
  
  // API & Integration
  api: APINode,
  
  // Memory & Validation
  memory: MemoryNode,
  validator: ValidatorNode,
  
  // User Query
  userQuery: UserQueryNode,
  user_query: UserQueryNode,

  // ==========================================
  // NEW AI NODES (Using GenericNode)
  // ==========================================
  llmChat: GenericNode,
  textClassifier: GenericNode,
  sentimentAnalyzer: GenericNode,
  textSummarizer: GenericNode,
  entityExtractor: GenericNode,
  translator: GenericNode,
  codeGenerator: GenericNode,
  imageAnalyzer: GenericNode,
  embeddingGenerator: GenericNode,
  qaExtractor: GenericNode,
  contentModerator: GenericNode,

  // ==========================================
  // NEW DATA NODES (Using GenericNode)
  // ==========================================
  jsonParser: GenericNode,
  csvParser: GenericNode,
  xmlParser: GenericNode,
  dataValidator: GenericNode,
  dataMapper: GenericNode,
  arrayProcessor: GenericNode,
  variableStore: GenericNode,
  variableReader: GenericNode,

  // ==========================================
  // NEW INTEGRATION NODES (Using GenericNode)
  // ==========================================
  httpRequest: GenericNode,
  webhookTrigger: GenericNode,
  database: GenericNode,
  googleSheets: GenericNode,
  notion: GenericNode,
  airtable: GenericNode,
  github: GenericNode,
  linkedin: GenericNode,
  twitter: GenericNode,
  youtube: GenericNode,
  stripe: GenericNode,
  aws: GenericNode,
  firebase: GenericNode,

  // ==========================================
  // NEW LOGIC NODES (Using GenericNode)
  // ==========================================
  switch: GenericNode,
  loop: GenericNode,
  delay: GenericNode,
  retry: GenericNode,
  merge: GenericNode,
  split: GenericNode,
  errorHandler: GenericNode,

  // ==========================================
  // NEW COMMUNICATION NODES (Using GenericNode)
  // ==========================================
  email: GenericNode,
  slack: GenericNode,
  discord: GenericNode,
  sms: GenericNode,
  pushNotification: GenericNode,

  // ==========================================
  // NEW TRANSFORM NODES (Using GenericNode)
  // ==========================================
  textFormatter: GenericNode,
};

export default nodeTypes;