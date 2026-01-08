
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  author: string;
  featured?: boolean;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

export type TemplateCategory = 'ai' | 'data' | 'automation' | 'integration' | 'communication' | 'analysis';

export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string; color: string }> = {
  ai: { label: 'AI & ML', icon: '🤖', color: '#8B5CF6' },
  data: { label: 'Data Processing', icon: '📊', color: '#10B981' },
  automation: { label: 'Automation', icon: '⚡', color: '#F59E0B' },
  integration: { label: 'Integration', icon: '🔗', color: '#3B82F6' },
  communication: { label: 'Communication', icon: '💬', color: '#EC4899' },
  analysis: { label: 'Analysis', icon: '📈', color: '#06B6D4' },
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ==========================================
  // AI & ML TEMPLATES (1-6)
  // ==========================================
  {
    id: 'content-generation-pipeline',
    name: 'Content Generation Pipeline',
    description: 'Generate blog posts, articles, or social media content with AI. Includes research, writing, and formatting stages.',
    category: 'ai',
    icon: '✍️',
    tags: ['content', 'writing', 'blog', 'marketing'],
    difficulty: 'beginner',
    estimatedTime: '5 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Topic Input', inputType: 'text', defaultValue: '', required: true },
      },
      {
        id: 'llm-research',
        type: 'llm',
        position: { x: 350, y: 100 },
        data: {
          label: 'Research Assistant',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'You are a research assistant. Gather key facts, statistics, and insights about the given topic. Provide structured research notes.',
          temperature: 0.3,
        },
      },
      {
        id: 'llm-writer',
        type: 'llm',
        position: { x: 600, y: 200 },
        data: {
          label: 'Content Writer',
          provider: 'google',
          model: 'gemini-2.5-pro-preview-05-06',
          systemPrompt: 'You are an expert content writer. Using the research provided, write an engaging, well-structured article. Include an introduction, main points, and conclusion.',
          temperature: 0.7,
        },
      },
      {
        id: 'llm-editor',
        type: 'llm',
        position: { x: 850, y: 200 },
        data: {
          label: 'Editor & Formatter',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'You are an editor. Review and improve the content for clarity, grammar, and engagement. Format with proper headings and paragraphs.',
          temperature: 0.3,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Final Content', outputType: 'display', format: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'llm-research', sourceHandle: 'output', targetHandle: 'query' },
      { id: 'e2', source: 'llm-research', target: 'llm-writer', sourceHandle: 'output', targetHandle: 'context' },
      { id: 'e3', source: 'input-1', target: 'llm-writer', sourceHandle: 'output', targetHandle: 'query' },
      { id: 'e4', source: 'llm-writer', target: 'llm-editor', sourceHandle: 'output', targetHandle: 'context' },
      { id: 'e5', source: 'llm-editor', target: 'output-1', sourceHandle: 'output', targetHandle: 'input' },
    ],
  },
  {
  id: 'rag-document-qa',
  name: 'RAG Document Q&A',
  description: 'Ask questions about your uploaded documents using Retrieval Augmented Generation. Upload documents first, then query them with natural language.',
  category: 'ai',
  icon: '📚',
  tags: ['rag', 'documents', 'qa', 'knowledge-base', 'retrieval'],
  difficulty: 'beginner',
  estimatedTime: '2 min setup',
  author: 'AskYia Team',
  featured: true,
  nodes: [
    {
      id: 'input-query',
      type: 'input',
      position: { x: 100, y: 200 },
      data: { 
        label: 'User Query', 
        inputType: 'text', 
        defaultValue: '', 
        required: true,
        placeholder: 'Ask a question about your documents...'
      },
    },
    {
      id: 'knowledge-base',
      type: 'knowledgeBase',
      position: { x: 400, y: 200 },
      data: {
        label: 'Knowledge Base',
        topK: 3,
        threshold: 0.7,
        includeMetadata: true,
        searchType: 'similarity',
      },
    },
    {
      id: 'llm-answer',
      type: 'llm',
      position: { x: 700, y: 200 },
      data: {
        label: 'Answer Generator',
        provider: 'google',
        model: 'gemini-2.5-flash-preview-05-20',
        systemPrompt: `You are a helpful assistant that answers questions based on the provided context from documents.

Instructions:
- Only answer based on the context provided
- If the context doesn't contain enough information, say so
- Quote relevant parts of the context when appropriate
- Be concise but thorough`,
        temperature: 0.3,
        maxTokens: 2048,
        useGlobalApiKey: true,
      },
    },
    {
      id: 'output-answer',
      type: 'output',
      position: { x: 1000, y: 200 },
      data: { 
        label: 'Answer', 
        outputType: 'display', 
        format: 'markdown' 
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'input-query', target: 'knowledge-base', sourceHandle: 'output', targetHandle: 'query' },
    { id: 'e2', source: 'knowledge-base', target: 'llm-answer', sourceHandle: 'context', targetHandle: 'context' },
    { id: 'e3', source: 'input-query', target: 'llm-answer', sourceHandle: 'output', targetHandle: 'query' },
    { id: 'e4', source: 'llm-answer', target: 'output-answer', sourceHandle: 'output', targetHandle: 'input' },
  ],
},
  {
    id: 'intelligent-chatbot',
    name: 'Intelligent Chatbot',
    description: 'Build a context-aware chatbot with memory, sentiment analysis, and intelligent responses.',
    category: 'ai',
    icon: '💬',
    tags: ['chatbot', 'conversation', 'customer-service'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'User Message', inputType: 'text' },
      },
      {
        id: 'sentiment-1',
        type: 'sentimentAnalyzer',
        position: { x: 350, y: 100 },
        data: { label: 'Analyze Sentiment', granularity: 'document', includeEmotions: true },
      },
      {
        id: 'llm-chat',
        type: 'llmChat',
        position: { x: 600, y: 200 },
        data: {
          label: 'Chat Assistant',
          provider: 'google',
          systemMessage: 'You are a helpful, friendly assistant. Respond appropriately based on the user sentiment. Be empathetic when they are frustrated, celebratory when they are happy.',
          memorySize: 20,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 850, y: 200 },
        data: { label: 'Bot Response', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'sentiment-1' },
      { id: 'e2', source: 'sentiment-1', target: 'llm-chat', targetHandle: 'context' },
      { id: 'e3', source: 'input-1', target: 'llm-chat', targetHandle: 'message' },
      { id: 'e4', source: 'llm-chat', target: 'output-1' },
    ],
  },
  {
    id: 'code-review-assistant',
    name: 'Code Review Assistant',
    description: 'Automated code review with security analysis, best practices, and improvement suggestions.',
    category: 'ai',
    icon: '🔍',
    tags: ['code', 'review', 'security', 'development'],
    difficulty: 'intermediate',
    estimatedTime: '5 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Code Input', inputType: 'text' },
      },
      {
        id: 'llm-security',
        type: 'llm',
        position: { x: 350, y: 100 },
        data: {
          label: 'Security Analyzer',
          provider: 'google',
          model: 'gemini-2.5-pro-preview-05-06',
          systemPrompt: 'You are a security expert. Analyze the code for security vulnerabilities, SQL injection, XSS, and other security issues. List findings with severity levels.',
          temperature: 0.2,
        },
      },
      {
        id: 'llm-quality',
        type: 'llm',
        position: { x: 350, y: 300 },
        data: {
          label: 'Quality Analyzer',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'You are a code quality expert. Review for best practices, code smells, performance issues, and maintainability. Suggest improvements.',
          temperature: 0.3,
        },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 600, y: 200 },
        data: { label: 'Combine Reviews', mode: 'waitAll', outputFormat: 'object' },
      },
      {
        id: 'llm-summary',
        type: 'llm',
        position: { x: 850, y: 200 },
        data: {
          label: 'Summary Generator',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Combine the security and quality reviews into a comprehensive, actionable code review report with prioritized recommendations.',
          temperature: 0.4,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Review Report', outputType: 'display', format: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'llm-security' },
      { id: 'e2', source: 'input-1', target: 'llm-quality' },
      { id: 'e3', source: 'llm-security', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e4', source: 'llm-quality', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e5', source: 'merge-1', target: 'llm-summary' },
      { id: 'e6', source: 'llm-summary', target: 'output-1' },
    ],
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'AI-powered research tool that searches, summarizes, and synthesizes information from multiple sources.',
    category: 'ai',
    icon: '🔬',
    tags: ['research', 'analysis', 'summary', 'academic'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Research Topic', inputType: 'text' },
      },
      {
        id: 'http-search',
        type: 'httpRequest',
        position: { x: 350, y: 200 },
        data: {
          label: 'Web Search',
          method: 'GET',
          url: 'https://api.search.com/search',
          timeout: 10000,
        },
      },
      {
        id: 'llm-extract',
        type: 'llm',
        position: { x: 600, y: 200 },
        data: {
          label: 'Information Extractor',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Extract key facts, findings, and relevant information from the search results. Organize by themes.',
          temperature: 0.3,
        },
      },
      {
        id: 'llm-synthesize',
        type: 'llm',
        position: { x: 850, y: 200 },
        data: {
          label: 'Research Synthesizer',
          provider: 'google',
          model: 'gemini-2.5-pro-preview-05-06',
          systemPrompt: 'Synthesize the extracted information into a comprehensive research summary. Include key findings, themes, and recommendations for further research.',
          temperature: 0.5,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Research Report', outputType: 'display', format: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'http-search' },
      { id: 'e2', source: 'http-search', target: 'llm-extract' },
      { id: 'e3', source: 'llm-extract', target: 'llm-synthesize' },
      { id: 'e4', source: 'input-1', target: 'llm-synthesize', targetHandle: 'query' },
      { id: 'e5', source: 'llm-synthesize', target: 'output-1' },
    ],
  },
  {
    id: 'multi-language-translator',
    name: 'Multi-Language Translator',
    description: 'Translate content into multiple languages simultaneously with quality verification.',
    category: 'ai',
    icon: '🌍',
    tags: ['translation', 'localization', 'languages', 'i18n'],
    difficulty: 'beginner',
    estimatedTime: '5 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 250 },
        data: { label: 'Source Text', inputType: 'text' },
      },
      {
        id: 'translator-es',
        type: 'translator',
        position: { x: 350, y: 100 },
        data: { label: 'Spanish', sourceLang: 'auto', targetLang: 'es' },
      },
      {
        id: 'translator-fr',
        type: 'translator',
        position: { x: 350, y: 250 },
        data: { label: 'French', sourceLang: 'auto', targetLang: 'fr' },
      },
      {
        id: 'translator-de',
        type: 'translator',
        position: { x: 350, y: 400 },
        data: { label: 'German', sourceLang: 'auto', targetLang: 'de' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 600, y: 250 },
        data: { label: 'Combine Translations', mode: 'waitAll', outputFormat: 'object' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 850, y: 250 },
        data: { label: 'All Translations', outputType: 'display', format: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'translator-es' },
      { id: 'e2', source: 'input-1', target: 'translator-fr' },
      { id: 'e3', source: 'input-1', target: 'translator-de' },
      { id: 'e4', source: 'translator-es', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e5', source: 'translator-fr', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e6', source: 'translator-de', target: 'merge-1', targetHandle: 'input3' },
      { id: 'e7', source: 'merge-1', target: 'output-1' },
    ],
  },
  {
    id: 'document-summarizer',
    name: 'Document Summarizer',
    description: 'Summarize long documents with extractive and abstractive summaries, key points, and action items.',
    category: 'ai',
    icon: '📄',
    tags: ['summary', 'documents', 'notes', 'productivity'],
    difficulty: 'beginner',
    estimatedTime: '3 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Document Text', inputType: 'text' },
      },
      {
        id: 'summarizer-1',
        type: 'textSummarizer',
        position: { x: 350, y: 100 },
        data: { label: 'Executive Summary', style: 'executive', maxLength: 200 },
      },
      {
        id: 'summarizer-2',
        type: 'textSummarizer',
        position: { x: 350, y: 300 },
        data: { label: 'Key Points', style: 'bullets', maxLength: 300 },
      },
      {
        id: 'llm-actions',
        type: 'llm',
        position: { x: 600, y: 200 },
        data: {
          label: 'Action Items Extractor',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Extract all action items, tasks, and next steps from the document. Format as a numbered list with owners if mentioned.',
          temperature: 0.2,
        },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 850, y: 200 },
        data: { label: 'Combine All', mode: 'waitAll' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Document Summary', outputType: 'display', format: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'summarizer-1' },
      { id: 'e2', source: 'input-1', target: 'summarizer-2' },
      { id: 'e3', source: 'input-1', target: 'llm-actions' },
      { id: 'e4', source: 'summarizer-1', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e5', source: 'summarizer-2', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e6', source: 'llm-actions', target: 'merge-1', targetHandle: 'input3' },
      { id: 'e7', source: 'merge-1', target: 'output-1' },
    ],
  },

  // ==========================================
  // DATA PROCESSING TEMPLATES (7-11)
  // ==========================================
  {
    id: 'etl-pipeline',
    name: 'ETL Pipeline',
    description: 'Extract, Transform, and Load data from APIs with validation and error handling.',
    category: 'data',
    icon: '🔄',
    tags: ['etl', 'data', 'pipeline', 'transform'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'http-extract',
        type: 'httpRequest',
        position: { x: 100, y: 200 },
        data: { label: 'Extract Data', method: 'GET', url: '', timeout: 30000 },
      },
      {
        id: 'json-parse',
        type: 'jsonParser',
        position: { x: 350, y: 200 },
        data: { label: 'Parse JSON', jsonPath: '$.data' },
      },
      {
        id: 'validator-1',
        type: 'dataValidator',
        position: { x: 600, y: 200 },
        data: { label: 'Validate Schema', validationType: 'jsonSchema', schema: '' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 850, y: 150 },
        data: { 
          label: 'Transform Data', 
          transformType: 'code',
          code: '// Transform your data here\nreturn data.map(item => ({\n  id: item.id,\n  name: item.name,\n  processed: true\n}));'
        },
      },
      {
        id: 'error-handler',
        type: 'errorHandler',
        position: { x: 850, y: 300 },
        data: { label: 'Handle Errors', onError: 'catch', logError: true },
      },
      {
        id: 'http-load',
        type: 'httpRequest',
        position: { x: 1100, y: 150 },
        data: { label: 'Load Data', method: 'POST', url: '', timeout: 30000 },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1350, y: 200 },
        data: { label: 'Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'http-extract', target: 'json-parse' },
      { id: 'e2', source: 'json-parse', target: 'validator-1' },
      { id: 'e3', source: 'validator-1', target: 'transform-1', sourceHandle: 'valid' },
      { id: 'e4', source: 'validator-1', target: 'error-handler', sourceHandle: 'invalid' },
      { id: 'e5', source: 'transform-1', target: 'http-load' },
      { id: 'e6', source: 'http-load', target: 'output-1' },
      { id: 'e7', source: 'error-handler', target: 'output-1', sourceHandle: 'error' },
    ],
  },
  {
    id: 'csv-to-json-converter',
    name: 'CSV to JSON Converter',
    description: 'Convert CSV files to JSON with data cleaning, validation, and transformation.',
    category: 'data',
    icon: '📊',
    tags: ['csv', 'json', 'conversion', 'data'],
    difficulty: 'beginner',
    estimatedTime: '5 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'CSV Input', inputType: 'text' },
      },
      {
        id: 'csv-parser',
        type: 'csvParser',
        position: { x: 350, y: 200 },
        data: { label: 'Parse CSV', delimiter: ',', hasHeader: true, trimValues: true },
      },
      {
        id: 'array-processor',
        type: 'arrayProcessor',
        position: { x: 600, y: 200 },
        data: { label: 'Clean Data', operation: 'filter', expression: 'item => item.id !== ""' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 850, y: 200 },
        data: { 
          label: 'Format Output',
          transformType: 'code',
          code: 'return JSON.stringify(data, null, 2);'
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'JSON Output', outputType: 'display', format: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'csv-parser' },
      { id: 'e2', source: 'csv-parser', target: 'array-processor', sourceHandle: 'json' },
      { id: 'e3', source: 'array-processor', target: 'transform-1' },
      { id: 'e4', source: 'transform-1', target: 'output-1' },
    ],
  },
  {
    id: 'data-validation-pipeline',
    name: 'Data Validation Pipeline',
    description: 'Validate incoming data against schemas with detailed error reporting.',
    category: 'data',
    icon: '✅',
    tags: ['validation', 'schema', 'quality', 'data'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Data Input', inputType: 'json' },
      },
      {
        id: 'json-parser',
        type: 'jsonParser',
        position: { x: 350, y: 200 },
        data: { label: 'Parse Input' },
      },
      {
        id: 'validator-1',
        type: 'dataValidator',
        position: { x: 600, y: 200 },
        data: { 
          label: 'Schema Validation',
          validationType: 'jsonSchema',
          schema: '{\n  "type": "object",\n  "required": ["id", "name"],\n  "properties": {\n    "id": {"type": "string"},\n    "name": {"type": "string"}\n  }\n}'
        },
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 850, y: 200 },
        data: { label: 'Check Valid', conditionType: 'exists', leftValue: 'data.valid' },
      },
      {
        id: 'output-success',
        type: 'output',
        position: { x: 1100, y: 100 },
        data: { label: 'Valid Data', outputType: 'display' },
      },
      {
        id: 'output-errors',
        type: 'output',
        position: { x: 1100, y: 300 },
        data: { label: 'Validation Errors', outputType: 'display', format: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'json-parser' },
      { id: 'e2', source: 'json-parser', target: 'validator-1' },
      { id: 'e3', source: 'validator-1', target: 'conditional-1' },
      { id: 'e4', source: 'conditional-1', target: 'output-success', sourceHandle: 'true' },
      { id: 'e5', source: 'conditional-1', target: 'output-errors', sourceHandle: 'false' },
    ],
  },
  {
    id: 'api-data-aggregator',
    name: 'API Data Aggregator',
    description: 'Aggregate data from multiple APIs into a unified response.',
    category: 'data',
    icon: '🔗',
    tags: ['api', 'aggregation', 'integration', 'data'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 250 },
        data: { label: 'Query Parameters', inputType: 'json' },
      },
      {
        id: 'http-api1',
        type: 'httpRequest',
        position: { x: 350, y: 100 },
        data: { label: 'API 1', method: 'GET', url: 'https://api1.example.com/data' },
      },
      {
        id: 'http-api2',
        type: 'httpRequest',
        position: { x: 350, y: 250 },
        data: { label: 'API 2', method: 'GET', url: 'https://api2.example.com/data' },
      },
      {
        id: 'http-api3',
        type: 'httpRequest',
        position: { x: 350, y: 400 },
        data: { label: 'API 3', method: 'GET', url: 'https://api3.example.com/data' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 600, y: 250 },
        data: { label: 'Merge Responses', mode: 'waitAll', outputFormat: 'object' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 850, y: 250 },
        data: {
          label: 'Normalize Data',
          transformType: 'code',
          code: '// Normalize and combine data from all APIs\nconst [api1, api2, api3] = data;\nreturn {\n  combined: [...(api1.items || []), ...(api2.items || []), ...(api3.items || [])],\n  sources: 3,\n  timestamp: new Date().toISOString()\n};'
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 250 },
        data: { label: 'Aggregated Data', outputType: 'display', format: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'http-api1' },
      { id: 'e2', source: 'input-1', target: 'http-api2' },
      { id: 'e3', source: 'input-1', target: 'http-api3' },
      { id: 'e4', source: 'http-api1', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e5', source: 'http-api2', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e6', source: 'http-api3', target: 'merge-1', targetHandle: 'input3' },
      { id: 'e7', source: 'merge-1', target: 'transform-1' },
      { id: 'e8', source: 'transform-1', target: 'output-1' },
    ],
  },
  {
    id: 'batch-data-processor',
    name: 'Batch Data Processor',
    description: 'Process large datasets in batches with progress tracking and error recovery.',
    category: 'data',
    icon: '📦',
    tags: ['batch', 'processing', 'large-data', 'parallel'],
    difficulty: 'advanced',
    estimatedTime: '20 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Data Array', inputType: 'json' },
      },
      {
        id: 'split-1',
        type: 'split',
        position: { x: 350, y: 200 },
        data: { label: 'Split into Batches', mode: 'chunks', chunkSize: 100 },
      },
      {
        id: 'loop-1',
        type: 'loop',
        position: { x: 600, y: 200 },
        data: { label: 'Process Batches', iterateOver: 'data', maxIterations: 1000, parallel: true, batchSize: 5 },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 850, y: 150 },
        data: { label: 'Process Item', transformType: 'code', code: '// Process each item\nreturn { ...data, processed: true };' },
      },
      {
        id: 'retry-1',
        type: 'retry',
        position: { x: 850, y: 300 },
        data: { label: 'Retry on Failure', maxRetries: 3, backoffType: 'exponential' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 1100, y: 200 },
        data: { label: 'Collect Results', mode: 'concat' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1350, y: 200 },
        data: { label: 'Processed Data', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'split-1' },
      { id: 'e2', source: 'split-1', target: 'loop-1' },
      { id: 'e3', source: 'loop-1', target: 'transform-1', sourceHandle: 'item' },
      { id: 'e4', source: 'transform-1', target: 'retry-1' },
      { id: 'e5', source: 'retry-1', target: 'merge-1', sourceHandle: 'success' },
      { id: 'e6', source: 'loop-1', target: 'merge-1', sourceHandle: 'completed' },
      { id: 'e7', source: 'merge-1', target: 'output-1' },
    ],
  },

  // ==========================================
  // AUTOMATION TEMPLATES (12-16)
  // ==========================================
  {
    id: 'email-automation',
    name: 'Email Automation',
    description: 'Automated email sending with templates, personalization, and tracking.',
    category: 'automation',
    icon: '📧',
    tags: ['email', 'automation', 'marketing', 'outreach'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Recipient Data', inputType: 'json' },
      },
      {
        id: 'llm-personalize',
        type: 'llm',
        position: { x: 350, y: 200 },
        data: {
          label: 'Personalize Content',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Create a personalized email based on the recipient data. Be professional yet friendly. Include their name and reference their specific interests.',
          temperature: 0.7,
        },
      },
      {
        id: 'text-formatter',
        type: 'textFormatter',
        position: { x: 600, y: 200 },
        data: { label: 'Format Email', operation: 'template', template: '' },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 850, y: 200 },
        data: { label: 'Send Email', provider: 'sendgrid', isHtml: true },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Send Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'llm-personalize' },
      { id: 'e2', source: 'llm-personalize', target: 'text-formatter' },
      { id: 'e3', source: 'text-formatter', target: 'email-1', targetHandle: 'body' },
      { id: 'e4', source: 'input-1', target: 'email-1' },
      { id: 'e5', source: 'email-1', target: 'output-1' },
    ],
  },
  {
    id: 'slack-notification-bot',
    name: 'Slack Notification Bot',
    description: 'Intelligent Slack bot that monitors events and sends smart notifications.',
    category: 'automation',
    icon: '🤖',
    tags: ['slack', 'notifications', 'bot', 'alerts'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'webhook-1',
        type: 'webhookTrigger',
        position: { x: 100, y: 200 },
        data: { label: 'Event Webhook', path: '/webhook/slack-bot', method: 'POST' },
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 350, y: 200 },
        data: { label: 'Check Priority', conditionType: 'comparison', leftValue: 'data.priority', operator: '==', rightValue: 'high' },
      },
      {
        id: 'llm-format',
        type: 'llm',
        position: { x: 600, y: 100 },
        data: {
          label: 'Format Alert',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Create a concise, attention-grabbing Slack message for this high-priority alert. Use appropriate emojis and formatting.',
          temperature: 0.5,
        },
      },
      {
        id: 'text-formatter',
        type: 'textFormatter',
        position: { x: 600, y: 300 },
        data: { label: 'Standard Format', operation: 'template', template: '📢 *Notification*\n{{message}}' },
      },
      {
        id: 'slack-1',
        type: 'slack',
        position: { x: 850, y: 200 },
        data: { label: 'Send to Slack', channel: '#alerts', operation: 'postMessage' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'webhook-1', target: 'conditional-1' },
      { id: 'e2', source: 'conditional-1', target: 'llm-format', sourceHandle: 'true' },
      { id: 'e3', source: 'conditional-1', target: 'text-formatter', sourceHandle: 'false' },
      { id: 'e4', source: 'llm-format', target: 'slack-1' },
      { id: 'e5', source: 'text-formatter', target: 'slack-1' },
      { id: 'e6', source: 'slack-1', target: 'output-1' },
    ],
  },
  {
    id: 'github-issue-automation',
    name: 'GitHub Issue Automation',
    description: 'Automatically triage, label, and respond to GitHub issues using AI.',
    category: 'automation',
    icon: '🐙',
    tags: ['github', 'issues', 'triage', 'automation'],
    difficulty: 'advanced',
    estimatedTime: '20 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'webhook-1',
        type: 'webhookTrigger',
        position: { x: 100, y: 200 },
        data: { label: 'GitHub Webhook', path: '/webhook/github', method: 'POST' },
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 350, y: 200 },
        data: { label: 'Is New Issue?', conditionType: 'comparison', leftValue: 'data.action', operator: '==', rightValue: 'opened' },
      },
      {
        id: 'classifier-1',
        type: 'textClassifier',
        position: { x: 600, y: 150 },
        data: { label: 'Classify Issue', categories: 'bug, feature, question, documentation', multiLabel: false },
      },
      {
        id: 'llm-response',
        type: 'llm',
        position: { x: 850, y: 100 },
        data: {
          label: 'Generate Response',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'You are a helpful GitHub bot. Based on the issue type and content, generate a friendly, helpful first response. Acknowledge the issue, ask for any missing information, and set expectations.',
          temperature: 0.6,
        },
      },
      {
        id: 'github-label',
        type: 'github',
        position: { x: 850, y: 250 },
        data: { label: 'Add Labels', operation: 'createIssue', owner: '', repo: '' },
      },
      {
        id: 'github-comment',
        type: 'github',
        position: { x: 1100, y: 150 },
        data: { label: 'Post Comment', operation: 'createIssue', owner: '', repo: '' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1350, y: 200 },
        data: { label: 'Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'webhook-1', target: 'conditional-1' },
      { id: 'e2', source: 'conditional-1', target: 'classifier-1', sourceHandle: 'true' },
      { id: 'e3', source: 'classifier-1', target: 'llm-response' },
      { id: 'e4', source: 'classifier-1', target: 'github-label' },
      { id: 'e5', source: 'llm-response', target: 'github-comment' },
      { id: 'e6', source: 'github-comment', target: 'output-1' },
      { id: 'e7', source: 'github-label', target: 'output-1' },
    ],
  },
  {
    id: 'scheduled-report-generator',
    name: 'Scheduled Report Generator',
    description: 'Generate and distribute automated reports on a schedule.',
    category: 'automation',
    icon: '📊',
    tags: ['reports', 'scheduled', 'analytics', 'automation'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'webhook-1',
        type: 'webhookTrigger',
        position: { x: 100, y: 200 },
        data: { label: 'Schedule Trigger', path: '/webhook/report', method: 'POST' },
      },
      {
        id: 'http-data',
        type: 'httpRequest',
        position: { x: 350, y: 200 },
        data: { label: 'Fetch Data', method: 'GET', url: '' },
      },
      {
        id: 'llm-analyze',
        type: 'llm',
        position: { x: 600, y: 200 },
        data: {
          label: 'Analyze & Report',
          provider: 'google',
          model: 'gemini-2.5-pro-preview-05-06',
          systemPrompt: 'Analyze the data and generate a comprehensive report. Include key metrics, trends, insights, and recommendations. Format with clear sections and bullet points.',
          temperature: 0.4,
        },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 850, y: 150 },
        data: { label: 'Email Report', provider: 'sendgrid', subject: 'Weekly Report', isHtml: true },
      },
      {
        id: 'slack-1',
        type: 'slack',
        position: { x: 850, y: 300 },
        data: { label: 'Slack Summary', channel: '#reports', operation: 'postMessage' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'webhook-1', target: 'http-data' },
      { id: 'e2', source: 'http-data', target: 'llm-analyze' },
      { id: 'e3', source: 'llm-analyze', target: 'email-1' },
      { id: 'e4', source: 'llm-analyze', target: 'slack-1' },
      { id: 'e5', source: 'email-1', target: 'output-1' },
      { id: 'e6', source: 'slack-1', target: 'output-1' },
    ],
  },
  {
    id: 'social-media-scheduler',
    name: 'Social Media Scheduler',
    description: 'Schedule and post content across multiple social media platforms.',
    category: 'automation',
    icon: '📱',
    tags: ['social', 'media', 'scheduling', 'marketing'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 250 },
        data: { label: 'Post Content', inputType: 'text' },
      },
      {
        id: 'llm-adapt',
        type: 'llm',
        position: { x: 350, y: 250 },
        data: {
          label: 'Adapt Content',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Adapt this content for different social media platforms. Create versions for: 1) Twitter (280 chars, hashtags), 2) LinkedIn (professional), 3) Instagram (engaging, emoji-rich). Return as JSON.',
          temperature: 0.7,
        },
      },
      {
        id: 'json-parser',
        type: 'jsonParser',
        position: { x: 600, y: 250 },
        data: { label: 'Parse Versions' },
      },
      {
        id: 'twitter-1',
        type: 'twitter',
        position: { x: 850, y: 100 },
        data: { label: 'Post to Twitter', operation: 'postTweet' },
      },
      {
        id: 'linkedin-1',
        type: 'linkedin',
        position: { x: 850, y: 250 },
        data: { label: 'Post to LinkedIn', operation: 'createPost' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 1100, y: 250 },
        data: { label: 'Collect Results', mode: 'waitAll' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1350, y: 250 },
        data: { label: 'Post Results', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'llm-adapt' },
      { id: 'e2', source: 'llm-adapt', target: 'json-parser' },
      { id: 'e3', source: 'json-parser', target: 'twitter-1' },
      { id: 'e4', source: 'json-parser', target: 'linkedin-1' },
      { id: 'e5', source: 'twitter-1', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e6', source: 'linkedin-1', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e7', source: 'merge-1', target: 'output-1' },
    ],
  },

  // ==========================================
  // INTEGRATION TEMPLATES (17-20)
  // ==========================================
  {
    id: 'crm-data-sync',
    name: 'CRM Data Sync',
    description: 'Synchronize data between CRM systems and databases.',
    category: 'integration',
    icon: '🔄',
    tags: ['crm', 'sync', 'database', 'integration'],
    difficulty: 'advanced',
    estimatedTime: '25 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'http-crm',
        type: 'httpRequest',
        position: { x: 100, y: 200 },
        data: { label: 'Fetch CRM Data', method: 'GET', url: '' },
      },
      {
        id: 'database-query',
        type: 'database',
        position: { x: 100, y: 350 },
        data: { label: 'Fetch DB Data', dbType: 'postgresql', operation: 'query' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 350, y: 275 },
        data: { label: 'Merge Data', mode: 'waitAll' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 600, y: 275 },
        data: {
          label: 'Compare & Diff',
          transformType: 'code',
          code: '// Find records that need syncing\nconst [crm, db] = data;\nconst toUpdate = crm.filter(c => !db.find(d => d.id === c.id) || db.find(d => d.id === c.id && d.updated < c.updated));\nreturn toUpdate;'
        },
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 850, y: 275 },
        data: { label: 'Has Updates?', conditionType: 'expression', expression: 'data.length > 0' },
      },
      {
        id: 'database-update',
        type: 'database',
        position: { x: 1100, y: 200 },
        data: { label: 'Update DB', dbType: 'postgresql', operation: 'execute' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1350, y: 275 },
        data: { label: 'Sync Result', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'http-crm', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e2', source: 'database-query', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e3', source: 'merge-1', target: 'transform-1' },
      { id: 'e4', source: 'transform-1', target: 'conditional-1' },
      { id: 'e5', source: 'conditional-1', target: 'database-update', sourceHandle: 'true' },
      { id: 'e6', source: 'conditional-1', target: 'output-1', sourceHandle: 'false' },
      { id: 'e7', source: 'database-update', target: 'output-1' },
    ],
  },
  {
    id: 'google-sheets-database-sync',
    name: 'Google Sheets ↔ Database Sync',
    description: 'Two-way sync between Google Sheets and your database.',
    category: 'integration',
    icon: '📗',
    tags: ['google-sheets', 'database', 'sync', 'spreadsheet'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    featured: true,
    nodes: [
      {
        id: 'sheets-read',
        type: 'googleSheets',
        position: { x: 100, y: 200 },
        data: { label: 'Read Sheets', operation: 'read', spreadsheetId: '', range: 'Sheet1!A:Z' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 350, y: 200 },
        data: {
          label: 'Transform to DB Format',
          transformType: 'code',
          code: '// Convert sheet rows to database records\nreturn data.map(row => ({\n  id: row[0],\n  name: row[1],\n  email: row[2],\n  updated_at: new Date().toISOString()\n}));'
        },
      },
      {
        id: 'loop-1',
        type: 'loop',
        position: { x: 600, y: 200 },
        data: { label: 'Process Each Row', iterateOver: 'data', parallel: false },
      },
      {
        id: 'database-upsert',
        type: 'database',
        position: { x: 850, y: 200 },
        data: { label: 'Upsert to DB', dbType: 'postgresql', operation: 'execute', query: 'INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, email = $3' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 200 },
        data: { label: 'Sync Complete', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'sheets-read', target: 'transform-1' },
      { id: 'e2', source: 'transform-1', target: 'loop-1' },
      { id: 'e3', source: 'loop-1', target: 'database-upsert', sourceHandle: 'item' },
      { id: 'e4', source: 'loop-1', target: 'output-1', sourceHandle: 'completed' },
    ],
  },
  {
    id: 'multi-channel-notification',
    name: 'Multi-Channel Notification',
    description: 'Send notifications across email, Slack, SMS, and push notifications.',
    category: 'integration',
    icon: '🔔',
    tags: ['notifications', 'multi-channel', 'alerts', 'messaging'],
    difficulty: 'intermediate',
    estimatedTime: '15 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 250 },
        data: { label: 'Notification Data', inputType: 'json' },
      },
      {
        id: 'switch-1',
        type: 'switch',
        position: { x: 350, y: 250 },
        data: { label: 'Route by Priority', switchValue: 'data.priority', case1: 'critical', case2: 'high', case3: 'normal', case4: 'low' },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 600, y: 100 },
        data: { label: 'Send Email', provider: 'sendgrid' },
      },
      {
        id: 'slack-1',
        type: 'slack',
        position: { x: 600, y: 200 },
        data: { label: 'Send Slack', channel: '#alerts', operation: 'postMessage' },
      },
      {
        id: 'sms-1',
        type: 'sms',
        position: { x: 600, y: 300 },
        data: { label: 'Send SMS', operation: 'sendSms' },
      },
      {
        id: 'push-1',
        type: 'pushNotification',
        position: { x: 600, y: 400 },
        data: { label: 'Send Push', provider: 'firebase' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 850, y: 250 },
        data: { label: 'Collect Results', mode: 'waitAny' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 250 },
        data: { label: 'Notification Sent', outputType: 'display' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'switch-1' },
      { id: 'e2', source: 'switch-1', target: 'email-1', sourceHandle: 'case1' },
      { id: 'e3', source: 'switch-1', target: 'slack-1', sourceHandle: 'case2' },
      { id: 'e4', source: 'switch-1', target: 'sms-1', sourceHandle: 'case3' },
      { id: 'e5', source: 'switch-1', target: 'push-1', sourceHandle: 'case4' },
      { id: 'e6', source: 'email-1', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e7', source: 'slack-1', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e8', source: 'sms-1', target: 'merge-1', targetHandle: 'input3' },
      { id: 'e9', source: 'push-1', target: 'merge-1', targetHandle: 'input4' },
      { id: 'e10', source: 'merge-1', target: 'output-1' },
    ],
  },
  {
    id: 'youtube-content-pipeline',
    name: 'YouTube Content Pipeline',
    description: 'Analyze YouTube videos, extract transcripts, and generate summaries or content.',
    category: 'integration',
    icon: '▶️',
    tags: ['youtube', 'video', 'content', 'analysis'],
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    author: 'AskYia Team',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Video URL/ID', inputType: 'text' },
      },
      {
        id: 'youtube-info',
        type: 'youtube',
        position: { x: 350, y: 150 },
        data: { label: 'Get Video Info', operation: 'getVideo' },
      },
      {
        id: 'youtube-transcript',
        type: 'youtube',
        position: { x: 350, y: 300 },
        data: { label: 'Get Transcript', operation: 'getTranscript' },
      },
      {
        id: 'merge-1',
        type: 'merge',
        position: { x: 600, y: 225 },
        data: { label: 'Combine Data', mode: 'waitAll' },
      },
      {
        id: 'llm-analyze',
        type: 'llm',
        position: { x: 850, y: 150 },
        data: {
          label: 'Generate Summary',
          provider: 'google',
          model: 'gemini-2.5-pro-preview-05-06',
          systemPrompt: 'Analyze this video transcript and metadata. Generate: 1) A comprehensive summary, 2) Key takeaways, 3) Timestamps for important sections, 4) Suggested related topics.',
          temperature: 0.5,
        },
      },
      {
        id: 'llm-blog',
        type: 'llm',
        position: { x: 850, y: 300 },
        data: {
          label: 'Generate Blog Post',
          provider: 'google',
          model: 'gemini-2.5-flash-preview-05-20',
          systemPrompt: 'Convert this video transcript into an engaging blog post. Maintain the key information while making it readable and well-structured.',
          temperature: 0.7,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1100, y: 225 },
        data: { label: 'Generated Content', outputType: 'display', format: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'youtube-info' },
      { id: 'e2', source: 'input-1', target: 'youtube-transcript' },
      { id: 'e3', source: 'youtube-info', target: 'merge-1', targetHandle: 'input1' },
      { id: 'e4', source: 'youtube-transcript', target: 'merge-1', targetHandle: 'input2' },
      { id: 'e5', source: 'merge-1', target: 'llm-analyze' },
      { id: 'e6', source: 'merge-1', target: 'llm-blog' },
      { id: 'e7', source: 'llm-analyze', target: 'output-1' },
      { id: 'e8', source: 'llm-blog', target: 'output-1' },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getTemplatesByCategory = (category: TemplateCategory): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(template => template.id === id);
};

export const getFeaturedTemplates = (): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(template => template.featured);
};

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getTemplateCount = (): number => {
  return WORKFLOW_TEMPLATES.length;
};

export const getTemplateCountByCategory = (): Record<TemplateCategory, number> => {
  const counts: Record<TemplateCategory, number> = {
    ai: 0,
    data: 0,
    automation: 0,
    integration: 0,
    communication: 0,
    analysis: 0,
  };

  WORKFLOW_TEMPLATES.forEach(template => {
    counts[template.category]++;
  });

  return counts;
};