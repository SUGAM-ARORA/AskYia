import { useState, useRef, useEffect } from "react";
import { useWorkflowStore } from "../../store/workflowSlice";
import { api } from "../../services/api";
import Logo from "../common/Logo";
import "../../styles/Chat.css";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
}

interface WorkflowDefinition {
  nodes: any[];
  edges: any[];
  knowledge_base_enabled?: boolean;
  prompt?: string;
  model?: string;
  provider?: string;
  temperature?: number;
  web_search?: boolean;
}

const ChatModal = () => {
  const { toggleChat, nodes, edges } = useWorkflowStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildWorkflowDefinition = (): WorkflowDefinition => {
    const workflowDef: WorkflowDefinition = {
      nodes: nodes,
      edges: edges,
      knowledge_base_enabled: false,
      prompt: undefined,
      model: undefined,
      provider: undefined,
      temperature: undefined,
      web_search: webSearchEnabled,
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
          workflowDef.model = nodeData.model || "gemini-2.0-flash";
          workflowDef.provider = nodeData.provider || "gemini";
          workflowDef.temperature = nodeData.temperature ?? 0.7;
          workflowDef.prompt = nodeData.prompt;
          if (nodeData.webSearch) {
            workflowDef.web_search = true;
          }
          break;
        case "prompt":
          if (nodeData.prompt) {
            workflowDef.prompt = nodeData.prompt;
          }
          break;
      }
    });

    return workflowDef;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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
      const workflowDefinition = buildWorkflowDefinition();

      const response = await api.post("/chat/ask", {
        query: userMessage.content,
        workflow_definition: workflowDefinition,
        prompt: workflowDefinition.prompt,
        web_search: webSearchEnabled || workflowDefinition.web_search,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.answer || "No response received.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat API error:", error);

      let errorContent = "Sorry, something went wrong. Please try again.";

      if (error.response?.data?.detail) {
        errorContent = `Error: ${error.response.data.detail}`;
      } else if (error.response?.status === 500) {
        errorContent = "Server error. Please check if the backend is running.";
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

  return (
    <div className="chat-modal-overlay" onClick={toggleChat}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-title">
            <Logo size={24} showText={false} />
            <span>AskYiaChat</span>
            {nodes.length > 0 && (
              <span className="chat-node-count">({nodes.length} nodes)</span>
            )}
          </div>
          <div className="chat-header-actions">
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
                <div className="message-content">{message.content}</div>
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
              placeholder="Send a message..."
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