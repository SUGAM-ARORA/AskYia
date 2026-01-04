import { Handle, Position } from "reactflow";
import { useState, useEffect, useMemo } from "react";
import { LLMNodeData } from "../../types/node.types";
import { LLMProvider, LLMModel } from "../../types/llm.types";
import { LLM_PROVIDERS, getProviderById, getDefaultModel, PROVIDER_ORDER } from "../../config/llmProviders";
import { useApiKeysStore } from "../../store/apiKeysSlice";
import "../../styles/Nodes.css";
import "../../styles/LLMNode.css";

const LLMNode = ({ data }: { data: LLMNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>(data.provider || "openai");
  const [model, setModel] = useState(data.model || "gpt-4o-mini");
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [useGlobalKey, setUseGlobalKey] = useState(data.useGlobalApiKey ?? true);
  const [temperature, setTemperature] = useState(data.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens ?? 4096);
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || "");
  const [webSearch, setWebSearch] = useState(data.webSearch || false);
  const [serpApiKey, setSerpApiKey] = useState(data.serpApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);

  const { getApiKey, hasApiKey } = useApiKeysStore();

  // Get current provider config
  const providerConfig = useMemo(() => getProviderById(provider), [provider]);
  
  // Get models for current provider
  const models = useMemo(() => providerConfig?.models || [], [providerConfig]);
  
  // Get current model info
  const currentModel = useMemo(
    () => models.find((m) => m.id === model),
    [models, model]
  );

  // Get effective API key (global or local)
  const effectiveApiKey = useMemo(() => {
    if (useGlobalKey) {
      return getApiKey(provider) || "";
    }
    return apiKey;
  }, [useGlobalKey, provider, apiKey, getApiKey]);

  // Update model when provider changes
  useEffect(() => {
    const defaultModel = getDefaultModel(provider);
    if (defaultModel && !models.find((m) => m.id === model)) {
      setModel(defaultModel);
      handleUpdate({ provider, model: defaultModel });
    }
  }, [provider, models]);

  const handleUpdate = (updates: Partial<LLMNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    const defaultModel = getDefaultModel(newProvider);
    setModel(defaultModel);
    handleUpdate({ provider: newProvider, model: defaultModel });
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    handleUpdate({ model: newModel });
  };

  return (
    <div className="custom-node llm-node">
      {/* Header */}
      <div 
        className="node-header llm-header"
        style={{ 
          background: providerConfig?.color || "#8B5CF6",
        }}
      >
        <div className="node-title">
          <span className="node-icon">{providerConfig?.icon || "✨"}</span>
          <span>LLM ({providerConfig?.name || "AI"})</span>
          {currentModel?.isNew && <span className="model-badge new">NEW</span>}
          {currentModel?.isBeta && <span className="model-badge beta">BETA</span>}
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">
            {currentModel?.description || "Configure your LLM provider and model"}
          </p>

          {/* Provider Selection */}
          <div className="form-group">
            <label className="form-label-small">Provider</label>
            <div className="provider-selector">
              {PROVIDER_ORDER.map((p) => {
                const config = LLM_PROVIDERS[p];
                const hasKey = hasApiKey(p);
                return (
                  <button
                    key={p}
                    className={`provider-option ${provider === p ? "active" : ""} ${hasKey ? "has-key" : ""}`}
                    onClick={() => handleProviderChange(p)}
                    title={`${config.name}${hasKey ? " (API key configured)" : ""}`}
                    style={{
                      borderColor: provider === p ? config.color : undefined,
                      background: provider === p ? config.bgColor : undefined,
                    }}
                  >
                    <span className="provider-icon">{config.icon}</span>
                    {hasKey && <span className="key-indicator">🔑</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div className="form-group">
            <label className="form-label-small">Model</label>
            <select
              className="form-select model-select"
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isNew ? "✨" : ""} {m.isBeta ? "(Beta)" : ""}
                </option>
              ))}
            </select>
            {currentModel && (
              <div className="model-info">
                <span className="model-context">
                  📄 {(currentModel.contextWindow / 1000).toFixed(0)}K context
                </span>
                {currentModel.capabilities.includes("vision") && (
                  <span className="model-capability">👁️ Vision</span>
                )}
                {currentModel.capabilities.includes("function_calling") && (
                  <span className="model-capability">⚡ Functions</span>
                )}
              </div>
            )}
          </div>

          {/* API Key */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label-small">API Key</label>
              <label className="use-global-toggle">
                <input
                  type="checkbox"
                  checked={useGlobalKey}
                  onChange={(e) => {
                    setUseGlobalKey(e.target.checked);
                    handleUpdate({ useGlobalApiKey: e.target.checked });
                  }}
                />
                <span>Use saved key</span>
              </label>
            </div>
            {useGlobalKey ? (
              <div className="global-key-status">
                {hasApiKey(provider) ? (
                  <span className="key-status success">
                    ✓ Using saved {providerConfig?.name} key
                  </span>
                ) : (
                  <span className="key-status warning">
                    ⚠ No saved key for {providerConfig?.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="input-with-icon">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="form-input-small"
                  placeholder={providerConfig?.apiKeyPlaceholder || "Enter API key"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    handleUpdate({ apiKey: e.target.value });
                  }}
                />
                <button
                  className="icon-button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? "🙈" : "👁️"}
                </button>
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div className="form-group">
            <label className="form-label-small">System Prompt</label>
            <textarea
              className="form-input-small system-prompt-input"
              placeholder="You are a helpful assistant..."
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                handleUpdate({ systemPrompt: e.target.value });
              }}
              rows={3}
            />
          </div>

          {/* Temperature */}
          <div className="form-group">
            <label className="form-label-small">Temperature</label>
            <div className="slider-container">
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
              <span className="slider-value">{temperature.toFixed(2)}</span>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▼" : "▶"} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="advanced-settings">
              {/* Max Tokens */}
              <div className="form-group">
                <label className="form-label-small">Max Tokens</label>
                <input
                  type="number"
                  className="form-input-small"
                  value={maxTokens}
                  min={1}
                  max={currentModel?.maxOutput || 4096}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 4096;
                    setMaxTokens(val);
                    handleUpdate({ maxTokens: val });
                  }}
                />
              </div>

              {/* Web Search Toggle */}
              <div className="form-group">
                <div className="toggle-container">
                  <span className="toggle-label">🌐 Web Search</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={webSearch}
                      onChange={(e) => {
                        setWebSearch(e.target.checked);
                        handleUpdate({ webSearch: e.target.checked });
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* SERP API Key (if web search enabled) */}
              {webSearch && (
                <div className="form-group">
                  <label className="form-label-small">SERP API Key</label>
                  <div className="input-with-icon">
                    <input
                      type={showSerpKey ? "text" : "password"}
                      className="form-input-small"
                      placeholder="SERP API Key"
                      value={serpApiKey}
                      onChange={(e) => {
                        setSerpApiKey(e.target.value);
                        handleUpdate({ serpApiKey: e.target.value });
                      }}
                    />
                    <button
                      className="icon-button"
                      onClick={() => setShowSerpKey(!showSerpKey)}
                      type="button"
                    >
                      {showSerpKey ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Info */}
          {currentModel?.inputPricing && (
            <div className="pricing-info">
              <span className="pricing-label">Pricing:</span>
              <span className="pricing-value">
                ${currentModel.inputPricing}/M in • ${currentModel.outputPricing}/M out
              </span>
            </div>
          )}
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="context"
        className="handle-blue"
        style={{ top: "40%" }}
        title="Context Input"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle-orange"
        style={{ top: "60%" }}
        title="Query Input"
      />

      {/* Footer with Output handle */}
      <div className="node-footer">
        <div></div>
        <div className="footer-handle">
          <span className="footer-handle-label">Output</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="handle-green"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LLMNode;