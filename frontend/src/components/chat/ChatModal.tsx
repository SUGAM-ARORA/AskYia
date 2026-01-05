
import { useState, useRef, useEffect } from "react";
import { useWorkflowStore } from "../../store/workflowSlice";
import { useApiKeysStore } from "../../store/apiKeysSlice";
import { api } from "../../services/api";
import { LLMProvider } from "../../types/llm.types";
import { LLM_PROVIDERS, getDefaultModel } from "../../config/llmProviders";
import Logo from "../common/Logo";
import "../../styles/Chat.css";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
}

interface WorkflowDefinition {
  nodes: any[];
  edges: any[];
  knowledge_base_enabled?: boolean;
  prompt?: string;
  model?: string;
  provider?: string;
  api_key?: string;
  temperature?: number;
  max_tokens?: number;
  web_search?: boolean;
  serp_api_key?: string;
}

// Default model preferences (Gemini 2.5/2.0)
const DEFAULT_PROVIDER: LLMProvider = "google";
const DEFAULT_MODELS = [
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.5-flash-preview-05-20", 
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
];

const ChatModal = () => {
  const { toggleChat, nodes, edges } = useWorkflowStore();
  const { getApiKey, hasApiKey } = useApiKeysStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<LLMProvider>(DEFAULT_PROVIDER);
  const [currentModel, setCurrentModel] = useState<string>(DEFAULT_MODELS[1]); // Default to Gemini 2.5 Flash
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract provider info from nodes for display, with smart defaults
  useEffect(() => {
    const llmNode = nodes.find((node) => {
      const nodeType = node.type?.toLowerCase();
      return (
        nodeType === "llm" ||
        nodeType === "llmengine" ||
        nodeType === "llm_engine" ||
        nodeType === "llmchat"
      );
    });

    if (llmNode?.data) {
      // Map "gemini" to "google" for provider lookup
      let provider = llmNode.data.provider || DEFAULT_PROVIDER;
      if (provider === "gemini") {
        provider = "google";
      }
      
      setCurrentProvider(provider as LLMProvider);
      setCurrentModel(llmNode.data.model || getPreferredModel(provider as LLMProvider));
    } else {
      // No LLM node - use defaults with Gemini
      setCurrentProvider(DEFAULT_PROVIDER);
      setCurrentModel(getPreferredModel(DEFAULT_PROVIDER));
    }
  }, [nodes]);

  // Get the best available model for a provider
  const getPreferredModel = (provider: LLMProvider): string => {
    if (provider === "google") {
      // Prefer Gemini 2.5 Flash, then 2.0, then 1.5
      const googleModels = LLM_PROVIDERS.google?.models || [];
      for (const preferredModel of DEFAULT_MODELS) {
        if (googleModels.some(m => m.id === preferredModel)) {
          return preferredModel;
        }
      }
      return googleModels[0]?.id || "gemini-2.0-flash-exp";
    }
    return getDefaultModel(provider);
  };

  const buildWorkflowDefinition = (): WorkflowDefinition => {
    // Start with smart defaults - prefer Google/Gemini
    const workflowDef: WorkflowDefinition = {
      nodes: nodes,
      edges: edges,
      knowledge_base_enabled: false,
      prompt: undefined,
      model: currentModel,
      provider: currentProvider,
      api_key: undefined,
      temperature: 0.7,
      max_tokens: undefined,
      web_search: webSearchEnabled,
      serp_api_key: undefined,
    };

    // Track if we found an LLM node
    let foundLLMNode = false;

    nodes.forEach((node) => {
      const nodeType = node.type?.toLowerCase();
      const nodeData = node.data || {};

      switch (nodeType) {
        case "knowledgebase":
        case "knowledge_base":
        case "knowledge":
        case "kb":
          workflowDef.knowledge_base_enabled = nodeData.enabled ?? true;
          break;

        case "llmengine":
        case "llm_engine":
        case "llm":
        case "llmchat":
          foundLLMNode = true;
          
          // Map "gemini" to "google" for consistency
          let nodeProvider = nodeData.provider || DEFAULT_PROVIDER;
          if (nodeProvider === "gemini") {
            nodeProvider = "google";
          }

          // Set provider and model
          workflowDef.provider = nodeProvider;
          workflowDef.model = nodeData.model || getPreferredModel(nodeProvider as LLMProvider);
          workflowDef.temperature = nodeData.temperature ?? 0.7;
          workflowDef.max_tokens = nodeData.maxTokens;
          workflowDef.prompt = nodeData.systemPrompt || nodeData.prompt;

          // Handle API key - prioritize global key
          const useGlobalKey = nodeData.useGlobalApiKey !== false;
          const provider = nodeProvider as LLMProvider;

          if (useGlobalKey) {
            const globalKey = getApiKey(provider);
            if (globalKey) {
              workflowDef.api_key = globalKey;
            } else if (nodeData.apiKey) {
              // Fallback to node's API key if no global key
              workflowDef.api_key = nodeData.apiKey;
            }
          } else if (nodeData.apiKey) {
            workflowDef.api_key = nodeData.apiKey;
          }

          // Handle web search
          if (nodeData.webSearch) {
            workflowDef.web_search = true;
            workflowDef.serp_api_key = nodeData.serpApiKey;
          }
          break;

        case "prompt":
          if (nodeData.prompt) {
            workflowDef.prompt = nodeData.prompt;
          }
          break;

        case "websearch":
        case "web_search":
          workflowDef.web_search = true;
          if (nodeData.apiKey) {
            workflowDef.serp_api_key = nodeData.apiKey;
          }
          break;
      }
    });

    // If no LLM node was found, use defaults with global API key
    if (!foundLLMNode) {
      workflowDef.provider = currentProvider;
      workflowDef.model = currentModel;
      
      // Try to get API key from global store
      const globalKey = getApiKey(currentProvider);
      if (globalKey) {
        workflowDef.api_key = globalKey;
      }
    }

    // Final fallback - try to get API key if still not set
    if (!workflowDef.api_key && workflowDef.provider) {
      const providerKey = getApiKey(workflowDef.provider as LLMProvider);
      if (providerKey) {
        workflowDef.api_key = providerKey;
      }
    }

    return workflowDef;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const workflowDefinition = buildWorkflowDefinition();

    // Check if API key is available
    if (!workflowDefinition.api_key) {
      const provider = workflowDefinition.provider || "google";
      const providerConfig = LLM_PROVIDERS[provider as LLMProvider];
      const providerName = providerConfig?.name || provider;

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "error",
        content: `🔑 No API key found for ${providerName}.\n\nPlease add your ${providerName} API key:\n1. Click the "🔑 Keys" button in the header\n2. Select "${providerName}" and enter your API key\n3. Or add the key directly in the LLM node settings`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat/ask", {
        query: userMessage.content,
        workflow_definition: workflowDefinition,
        prompt: workflowDefinition.prompt,
        model: workflowDefinition.model,
        provider: workflowDefinition.provider,
        api_key: workflowDefinition.api_key,
        temperature: workflowDefinition.temperature,
        max_tokens: workflowDefinition.max_tokens,
        web_search: webSearchEnabled || workflowDefinition.web_search,
        serp_api_key: workflowDefinition.serp_api_key,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.answer || "No response received.",
        timestamp: new Date(),
        provider: workflowDefinition.provider,
        model: workflowDefinition.model,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat API error:", error);

      let errorContent = "Sorry, something went wrong. Please try again.";

      if (error.response?.data?.detail) {
        errorContent = `Error: ${error.response.data.detail}`;
      } else if (error.response?.status === 401) {
        errorContent =
          "🔐 Invalid API key. Please check your API key configuration in the Keys manager.";
      } else if (error.response?.status === 429) {
        errorContent =
          "⏳ Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.response?.status === 500) {
        errorContent =
          "🔧 Server error. Please check if the backend is running and the API key is valid.";
      } else if (error.code === "ERR_NETWORK") {
        errorContent =
          "🌐 Cannot connect to server. Please ensure the backend is running at http://localhost:8001";
      } else if (error.message) {
        errorContent = `❌ Error: ${error.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "error",
        content: errorContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Get provider display info
  const getProviderInfo = () => {
    if (!currentProvider) return null;
    return LLM_PROVIDERS[currentProvider];
  };

  const providerInfo = getProviderInfo();
  const hasKey = hasApiKey(currentProvider);

  // Format model name for display
  const formatModelName = (model: string): string => {
    if (!model) return "Unknown";
    
    // Extract meaningful part of model name
    if (model.includes("gemini")) {
      if (model.includes("2.5-pro")) return "Gemini 2.5 Pro";
      if (model.includes("2.5-flash")) return "Gemini 2.5 Flash";
      if (model.includes("2.0-flash")) return "Gemini 2.0 Flash";
      if (model.includes("1.5-pro")) return "Gemini 1.5 Pro";
      if (model.includes("1.5-flash")) return "Gemini 1.5 Flash";
    }
    
    // Default: take first 2-3 parts
    return model.split("-").slice(0, 3).join("-");
  };

  return (
    <div className="chat-modal-overlay" onClick={toggleChat}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-title">
            <Logo size={24} showText={false} />
            <span>AskYia Chat</span>
            {nodes.length > 0 && (
              <span className="chat-node-count">({nodes.length} nodes)</span>
            )}
          </div>
          <div className="chat-header-actions">
            {/* Provider Badge */}
            {providerInfo && (
              <div
                className={`chat-provider-badge ${hasKey ? "has-key" : "no-key"}`}
                style={{
                  background: providerInfo.bgColor,
                  borderColor: hasKey ? providerInfo.color : "#EF4444",
                }}
                title={`${hasKey ? "✓" : "✗"} ${providerInfo.name}: ${currentModel}`}
              >
                <span className="provider-icon">{providerInfo.icon}</span>
                <span className="provider-name">{formatModelName(currentModel)}</span>
                {!hasKey && <span className="key-warning">🔑</span>}
              </div>
            )}
            <button
              className={`chat-web-toggle ${webSearchEnabled ? "active" : ""}`}
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              title="Toggle web search"
            >
              🌐 Web
            </button>
            <button
              className="chat-clear"
              onClick={clearChat}
              title="Clear chat"
            >
              🗑️
            </button>
            <button className="chat-close" onClick={toggleChat}>
              ✕
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <Logo size={48} showText={false} />
              <h3>Start a conversation</h3>
              <p>Chat with your AI workflow powered by:</p>
              {providerInfo && (
                <div className="chat-provider-info-box">
                  <span className="provider-icon-large">{providerInfo.icon}</span>
                  <div className="provider-details">
                    <span className="provider-name-large">{providerInfo.name}</span>
                    <span className="model-name">{formatModelName(currentModel)}</span>
                  </div>
                  {hasKey ? (
                    <span className="key-status success">✓ API Key Set</span>
                  ) : (
                    <span className="key-status error">🔑 No API Key</span>
                  )}
                </div>
              )}
              {!hasKey && (
                <p className="api-key-hint">
                  Click the <strong>🔑 Keys</strong> button in the header to add your API key
                </p>
              )}
              {webSearchEnabled && (
                <p className="chat-web-notice">🌐 Web search is enabled</p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <div className="message-icon">
                  {message.role === "user" ? (
                    "👤"
                  ) : message.role === "error" ? (
                    "⚠️"
                  ) : (
                    <Logo size={24} showText={false} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  {message.role === "assistant" && message.provider && (
                    <div className="message-meta">
                      {LLM_PROVIDERS[message.provider as LLMProvider]?.icon}{" "}
                      {formatModelName(message.model || "")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="message-icon">
                <Logo size={24} showText={false} />
              </div>
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span className="loading-text">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {webSearchEnabled && (
            <div className="chat-web-indicator">
              🌐 Web search enabled - AI will search the internet for current information
            </div>
          )}
          {!hasKey && (
            <div className="chat-api-warning">
              ⚠️ No API key configured. Click 🔑 Keys to add your {providerInfo?.name || "provider"} API key.
            </div>
          )}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder={
                hasKey
                  ? `Message ${providerInfo?.name || "AI"}...`
                  : "Add API key to start chatting..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title={hasKey ? "Send message" : "API key required"}
            >
              {isLoading ? (
                <span className="send-loading">●</span>
              ) : (
                "➤"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;