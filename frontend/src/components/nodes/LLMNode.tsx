import { Handle, Position } from "reactflow";
import { useState, useEffect } from "react";
import { LLMNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

// Model options by provider
const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  gemini: [
    // Gemini 2.5 series (latest)
    { value: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash (Preview)" },
    { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro (Preview)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    // Gemini 2.0 series
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Exp)" },
    { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro" },
    // Gemini 1.5 series
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Latest)" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Latest)" },
    // Legacy
    { value: "gemini-pro", label: "Gemini Pro (Legacy)" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
};

const PROVIDER_OPTIONS = [
  { value: "gemini", label: "Google Gemini", icon: "🔷" },
  { value: "openai", label: "OpenAI", icon: "🟢" },
];

const LLMNode = ({ data }: { data: LLMNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [provider, setProvider] = useState(data.provider || "gemini");
  const [model, setModel] = useState(data.model || "gemini-2.0-flash");
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [prompt, setPrompt] = useState(
    data.prompt ||
      `You are a helpful PDF assistant. Use web search if the PDF lacks context\n\nCONTEXT: {context}\nUser Query: {query}`
  );
  const [temperature, setTemperature] = useState(data.temperature || 0.75);
  const [webSearch, setWebSearch] = useState(data.webSearch || false);
  const [serpApiKey, setSerpApiKey] = useState(data.serpApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);

  // Get available models for current provider
  const availableModels = MODEL_OPTIONS[provider] || MODEL_OPTIONS.gemini;

  // Get current provider info
  const currentProvider =
    PROVIDER_OPTIONS.find((p) => p.value === provider) || PROVIDER_OPTIONS[0];

  // When provider changes, reset model to first available option
  useEffect(() => {
    const currentModels = MODEL_OPTIONS[provider] || [];
    const modelExists = currentModels.some((m) => m.value === model);

    if (!modelExists && currentModels.length > 0) {
      const newModel = currentModels[0].value;
      setModel(newModel);
      handleUpdate({ model: newModel });
    }
  }, [provider]);

  const handleUpdate = (updates: Partial<LLMNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const newModels = MODEL_OPTIONS[newProvider] || [];
    const newModel = newModels[0]?.value || "";
    setModel(newModel);
    handleUpdate({ provider: newProvider, model: newModel });
  };

  // Get current model label
  const currentModelLabel =
    availableModels.find((m) => m.value === model)?.label || model;

  return (
    <div className="custom-node llm-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">✨</span>
          <span>LLM ({currentProvider.label})</span>
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="node-divider"></div>
          <div className="node-body">
            <p className="node-description">
              Run a query with {currentProvider.label}
            </p>

            {/* Provider Selection */}
            <div className="form-group">
              <label className="form-label-small">Provider</label>
              <select
                className="form-select"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="form-group">
              <label className="form-label-small">Model</label>
              <select
                className="form-select"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  handleUpdate({ model: e.target.value });
                }}
              >
                {availableModels.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key - Only show for OpenAI since Gemini uses backend key */}
            {provider === "openai" && (
              <div className="form-group">
                <label className="form-label-small">API Key</label>
                <div className="input-with-icon">
                  <input
                    type={showApiKey ? "text" : "password"}
                    className="form-input-small"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      handleUpdate({ apiKey: e.target.value });
                    }}
                  />
                  <button
                    className="icon-button"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    👁
                  </button>
                </div>
              </div>
            )}

            {/* Gemini API Key notice */}
            {provider === "gemini" && (
              <div className="form-group">
                <div className="api-key-notice">
                  ✅ Using server-side Gemini API key
                </div>
              </div>
            )}

            {/* Prompt */}
            <div className="form-group">
              <label className="form-label-small">Prompt</label>
              <textarea
                className="form-input-small"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  handleUpdate({ prompt: e.target.value });
                }}
                rows={6}
              />
            </div>

            {/* Temperature */}
            <div className="form-group">
              <label className="form-label-small">
                Temperature ({temperature.toFixed(2)})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTemperature(val);
                  handleUpdate({ temperature: val });
                }}
                className="slider"
              />
              <div className="slider-labels">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Web Search Toggle */}
            <div className="form-group">
              <label className="form-label-small checkbox-label">
                <input
                  type="checkbox"
                  checked={webSearch}
                  onChange={(e) => {
                    setWebSearch(e.target.checked);
                    handleUpdate({ webSearch: e.target.checked });
                  }}
                />
                🌐 WebSearch Tool
              </label>
            </div>

            {/* SERP API Key - Only when web search is enabled */}
            {webSearch && (
              <div className="form-group">
                <label className="form-label-small">SERP API</label>
                <div className="input-with-icon">
                  <input
                    type={showSerpKey ? "text" : "password"}
                    className="form-input-small"
                    placeholder="SERP API Key (or use server key)"
                    value={serpApiKey}
                    onChange={(e) => {
                      setSerpApiKey(e.target.value);
                      handleUpdate({ serpApiKey: e.target.value });
                    }}
                  />
                  <button
                    className="icon-button"
                    onClick={() => setShowSerpKey(!showSerpKey)}
                  >
                    👁
                  </button>
                </div>
                <div className="api-key-notice small">
                  Leave empty to use server-side SerpAPI key
                </div>
              </div>
            )}

            {/* Current Selection Display */}
            <div className="model-badge">
              {currentProvider.icon} {currentModelLabel}
            </div>
          </div>
        </>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle-orange"
        style={{ top: "35%" }}
      >
        <div className="handle-label-left">Query</div>
      </Handle>

      <Handle
        type="target"
        position={Position.Left}
        id="context"
        className="handle-blue"
        style={{ top: "50%" }}
      >
        <div className="handle-label-left">Context</div>
      </Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="handle-blue"
        style={{ top: "50%" }}
      >
        <div className="handle-label">Output</div>
      </Handle>
    </div>
  );
};

export default LLMNode;