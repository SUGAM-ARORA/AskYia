import { useState, useRef, useEffect } from "react";
import { useWorkflowStore } from "../../store/workflowSlice";
import { useApiKeysStore } from "../../store/apiKeysSlice";
import { api } from "../../services/api";
import { LLMProvider } from "../../types/llm.types";
import { LLM_PROVIDERS } from "../../config/llmProviders";
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

const ChatModal = () => {
  const { toggleChat, nodes, edges } = useWorkflowStore();
  const { getApiKey } = useApiKeysStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract provider info from nodes for display
  useEffect(() => {
    const llmNode = nodes.find((node) => 
      node.type?.toLowerCase() === "llm" || 
      node.type?.toLowerCase() === "llmengine" ||
      node.type?.toLowerCase() === "llm_engine"
    );
    
    if (llmNode?.data) {
      setCurrentProvider(llmNode.data.provider || "openai");
      setCurrentModel(llmNode.data.model || "gpt-4o-mini");
    }
  }, [nodes]);

  const buildWorkflowDefinition = (): WorkflowDefinition => {
    const workflowDef: WorkflowDefinition = {
      nodes: nodes,
      edges: edges,
      knowledge_base_enabled: false,
      prompt: undefined,
      model: undefined,
      provider: undefined,
      api_key: undefined,
      temperature: undefined,
      max_tokens: undefined,
      web_search: webSearchEnabled,
      serp_api_key: undefined,
    };

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
          // Set provider and model
          workflowDef.provider = nodeData.provider || "openai";
          workflowDef.model = nodeData.model || "gpt-4o-mini";
          workflowDef.temperature = nodeData.temperature ?? 0.7;
          workflowDef.max_tokens = nodeData.maxTokens;
          workflowDef.prompt = nodeData.systemPrompt || nodeData.prompt;
          
          // Handle API key - prioritize global key if useGlobalApiKey is true or not set
          const useGlobalKey = nodeData.useGlobalApiKey !== false;
          const provider = nodeData.provider as LLMProvider || "openai";
          
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

    return workflowDef;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const workflowDefinition = buildWorkflowDefinition();
    
    // Check if API key is available
    if (!workflowDefinition.api_key) {
      const provider = workflowDefinition.provider || "openai";
      const providerName = LLM_PROVIDERS[provider as LLMProvider]?.name || provider;
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "error",
        content: `No API key found for ${providerName}. Please add your API key in the LLM node or use the 🔑 Keys button in the header to manage global API keys.`,
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
        errorContent = "Invalid API key. Please check your API key configuration.";
      } else if (error.response?.status === 429) {
        errorContent = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.response?.status === 500) {
        errorContent = "Server error. Please check if the backend is running and the API key is valid.";
      } else if (error.code === "ERR_NETWORK") {
        errorContent =
          "Cannot connect to server. Please ensure the backend is running at http://localhost:8001";
      } else if (error.message) {
        errorContent = `Error: ${error.message}`;
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
    const provider = LLM_PROVIDERS[currentProvider as LLMProvider];
    return provider;
  };

  const providerInfo = getProviderInfo();

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
                className="chat-provider-badge"
                style={{ 
                  background: providerInfo.bgColor,
                  borderColor: providerInfo.color,
                }}
                title={`Using ${providerInfo.name}: ${currentModel}`}
              >
                <span>{providerInfo.icon}</span>
                <span className="provider-name">{currentModel?.split('-').slice(0, 2).join('-')}</span>
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
              <p>Start a conversation with your AI stack</p>
              {providerInfo && (
                <p className="chat-provider-info">
                  {providerInfo.icon} Using {providerInfo.name} • {currentModel}
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
                  {message.content}
                  {message.role === "assistant" && message.provider && (
                    <div className="message-meta">
                      {LLM_PROVIDERS[message.provider as LLMProvider]?.icon} {message.model}
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
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {webSearchEnabled && (
            <div className="chat-web-indicator">
              🌐 Web search enabled - AI will search the internet
            </div>
          )}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder={`Message ${providerInfo?.name || 'AI'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? "..." : "➤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;