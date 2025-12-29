import { Handle, Position } from "reactflow";
import { useState, useEffect } from "react";
import { LLMNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT 4o- Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const LLMNode = ({ data }: { data: LLMNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [model, setModel] = useState(data.model || "gpt-4o-mini");
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [temperature, setTemperature] = useState(data.temperature || 0.75);
  const [webSearch, setWebSearch] = useState(data.webSearch || false);
  const [serpApiKey, setSerpApiKey] = useState(data.serpApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);

  const handleUpdate = (updates: Partial<LLMNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  return (
    <div className="custom-node llm-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">✨</span>
          <span>LLM (OpenAI)</span>
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          ⚙️
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">Run a query with OpenAI LLM</p>

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
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
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

          {/* Prompt Preview with colored placeholders */}
          <div className="form-group">
            <label className="form-label-small">Prompt</label>
            <div className="prompt-preview">
              <p>You are a helpful PDF assistant. Use web search if the PDF lacks context</p>
              <p style={{ marginTop: "8px" }}>
                <span className="prompt-context">CONTEXT:</span> {"{context}"}
              </p>
              <p>
                <span className="prompt-query">User Query:</span> {"{query}"}
              </p>
            </div>
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

          {/* Web Search Toggle */}
          <div className="form-group">
            <div className="toggle-container">
              <span className="toggle-label">WebSearch Tool</span>
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

          {/* SERP API Key */}
          {webSearch && (
            <div className="form-group">
              <label className="form-label-small">SERP API</label>
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
                >
                  👁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Left side handles for Context and Query inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="context"
        className="handle-blue"
        style={{ top: "40%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle-blue"
        style={{ top: "55%" }}
      />

      {/* Footer with Output handle on bottom right */}
      <div className="node-footer">
        <div></div>
        <div className="footer-handle">
          <span className="footer-handle-label">Output</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="handle-blue"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LLMNode;