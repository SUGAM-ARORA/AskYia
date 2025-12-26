import { Handle, Position } from "reactflow";
import { useState } from "react";
import { LLMNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const LLMNode = ({ data }: { data: LLMNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [model, setModel] = useState(data.model || "gpt-4o-mini");
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
        <>
          <div className="node-divider"></div>
          <div className="node-body">
            <p className="node-description">Run a query with OpenAI</p>

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
                <option value="gpt-4o-mini">GPT 4o-Mini</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

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

            <div className="form-group">
              <label className="form-label-small">
                Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTemperature(val);
                  handleUpdate({ temperature: val });
                }}
                className="slider"
              />
            </div>

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
                WebSearch Tool
              </label>
            </div>

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
