// src/components/nodes/GenericNode.tsx
import { useState, useMemo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { getNodeByType, NodeDefinition, ConfigField } from "../../data/nodeDefinitions";
import { useApiKeysStore } from "../../store/apiKeysSlice";
import { LLM_PROVIDERS, getProviderModels, PROVIDER_ORDER } from "../../config/llmProviders";
import { LLMProvider } from "../../types/llm.types";
import "../../styles/GenericNode.css";

interface GenericNodeProps extends NodeProps {
  data: {
    label?: string;
    onUpdate?: (updates: Record<string, any>) => void;
    [key: string]: any;
  };
}

const GenericNode = ({ type, data, selected }: GenericNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localData, setLocalData] = useState<Record<string, any>>(data);
  const { getApiKey, hasApiKey } = useApiKeysStore();

  // Get node definition
  const nodeDef = useMemo(() => getNodeByType(type), [type]);

  if (!nodeDef) {
    return (
      <div className="generic-node error-node">
        <div className="node-header error">
          <span>⚠️ Unknown Node: {type}</span>
        </div>
      </div>
    );
  }

  // Handle data updates
  const handleUpdate = useCallback(
    (field: string, value: any) => {
      const updates = { [field]: value };
      setLocalData((prev) => ({ ...prev, ...updates }));
      if (data.onUpdate) {
        data.onUpdate(updates);
      }
    },
    [data]
  );

  // Get dynamic models for LLM provider
  const getModelsForProvider = useCallback((provider: string) => {
    const models = getProviderModels(provider as LLMProvider);
    return models.map((m) => ({ value: m.id, label: m.name }));
  }, []);

  // Render config field
  const renderConfigField = (field: ConfigField, index: number) => {
    const value = localData[field.name] ?? field.default ?? "";
    const isAdvanced = index > 3 && nodeDef.configFields.length > 5;

    if (isAdvanced && !showAdvanced) return null;

    // Special handling for provider selection in LLM nodes
    if (field.name === "provider" && (type === "llm" || type === "llmChat")) {
      return (
        <div key={field.name} className="config-field provider-field">
          <label className="field-label">{field.label}</label>
          <div className="provider-grid">
            {PROVIDER_ORDER.map((p) => {
              const config = LLM_PROVIDERS[p];
              const hasKey = hasApiKey(p);
              return (
                <button
                  key={p}
                  className={`provider-btn ${value === p ? "active" : ""} ${hasKey ? "has-key" : ""}`}
                  onClick={() => {
                    handleUpdate("provider", p);
                    // Update model to default for new provider
                    const models = getProviderModels(p);
                    if (models.length > 0) {
                      handleUpdate("model", models[0].id);
                    }
                  }}
                  title={`${config.name}${hasKey ? " (API key set)" : ""}`}
                  style={{
                    borderColor: value === p ? config.color : undefined,
                    background: value === p ? config.bgColor : undefined,
                  }}
                >
                  <span className="provider-icon">{config.icon}</span>
                  {hasKey && <span className="key-dot">●</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Special handling for model selection - dynamic based on provider
    if (field.name === "model" && (type === "llm" || type === "llmChat")) {
      const provider = localData.provider || "google";
      const models = getModelsForProvider(provider);
      return (
        <div key={field.name} className="config-field">
          <label className="field-label">{field.label}</label>
          <select
            className="field-select"
            value={value}
            onChange={(e) => handleUpdate(field.name, e.target.value)}
          >
            {models.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    switch (field.type) {
      case "text":
      case "password":
        return (
          <div key={field.name} className="config-field">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type={field.type}
              className="field-input"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleUpdate(field.name, e.target.value)}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="config-field">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              className="field-textarea"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleUpdate(field.name, e.target.value)}
              rows={3}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="config-field">
            <label className="field-label">{field.label}</label>
            <input
              type="number"
              className="field-input"
              value={value}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              onChange={(e) => handleUpdate(field.name, parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="config-field">
            <label className="field-label">{field.label}</label>
            <select
              className="field-select"
              value={value}
              onChange={(e) => handleUpdate(field.name, e.target.value)}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} className="config-field boolean-field">
            <label className="field-label">{field.label}</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleUpdate(field.name, e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        );

      case "slider":
        return (
          <div key={field.name} className="config-field slider-field">
            <label className="field-label">
              {field.label}
              <span className="slider-value">{value}</span>
            </label>
            <input
              type="range"
              className="field-slider"
              min={field.min || 0}
              max={field.max || 1}
              step={field.step || 0.1}
              value={value}
              onChange={(e) => handleUpdate(field.name, parseFloat(e.target.value))}
            />
          </div>
        );

      case "code":
      case "json":
        return (
          <div key={field.name} className="config-field">
            <label className="field-label">{field.label}</label>
            <textarea
              className="field-code"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleUpdate(field.name, e.target.value)}
              rows={4}
              spellCheck={false}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Determine which fields are "basic" vs "advanced"
  const basicFields = nodeDef.configFields.slice(0, 4);
  const advancedFields = nodeDef.configFields.slice(4);
  const hasAdvanced = advancedFields.length > 0;

  return (
    <div
      className={`generic-node ${selected ? "selected" : ""}`}
      style={{
        "--node-color": nodeDef.color,
        "--node-bg": nodeDef.bgColor,
      } as React.CSSProperties}
    >
      {/* Input Handles */}
      {nodeDef.inputs.map((input, idx) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="node-handle input-handle"
          style={{
            top: `${((idx + 1) / (nodeDef.inputs.length + 1)) * 100}%`,
          }}
          title={input.label}
        />
      ))}

      {/* Header */}
      <div className="node-header" style={{ background: nodeDef.color }}>
        <div className="header-content">
          <span className="header-icon">{nodeDef.icon}</span>
          <span className="header-label">{data.label || nodeDef.label}</span>
        </div>
        <button
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="node-body">
          <p className="node-description">{nodeDef.description}</p>

          {/* Config Fields */}
          <div className="config-fields">
            {basicFields.map((field, idx) => renderConfigField(field, idx))}
          </div>

          {/* Advanced Toggle */}
          {hasAdvanced && (
            <>
              <button
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="toggle-icon">{showAdvanced ? "▼" : "▶"}</span>
                <span>Advanced Settings ({advancedFields.length})</span>
              </button>

              {showAdvanced && (
                <div className="config-fields advanced">
                  {advancedFields.map((field, idx) =>
                    renderConfigField(field, idx + 4)
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer with outputs */}
      <div className="node-footer">
        <div className="output-labels">
          {nodeDef.outputs.map((output) => (
            <span key={output.id} className="output-label">
              {output.label} →
            </span>
          ))}
        </div>
      </div>

      {/* Output Handles */}
      {nodeDef.outputs.map((output, idx) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className="node-handle output-handle"
          style={{
            top: `${((idx + 1) / (nodeDef.outputs.length + 1)) * 100}%`,
          }}
          title={output.label}
        />
      ))}
    </div>
  );
};

export default GenericNode;