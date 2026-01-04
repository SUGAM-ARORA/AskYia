import { useState } from "react";
import { useApiKeysStore } from "../../store/apiKeysSlice";
import { LLM_PROVIDERS, PROVIDER_ORDER } from "../../config/llmProviders";
import { LLMProvider } from "../../types/llm.types";
import "../../styles/ApiKeyManager.css";

interface ApiKeyManagerProps {
  onClose: () => void;
}

const ApiKeyManager = ({ onClose }: ApiKeyManagerProps) => {
  const { keys, setApiKey, removeApiKey, hasApiKey } = useApiKeysStore();
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [tempKey, setTempKey] = useState("");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleSaveKey = (provider: LLMProvider) => {
    if (tempKey.trim()) {
      setApiKey(provider, tempKey.trim());
    }
    setEditingProvider(null);
    setTempKey("");
  };

  const handleEditKey = (provider: LLMProvider) => {
    setEditingProvider(provider);
    setTempKey(keys[provider] || "");
  };

  const handleRemoveKey = (provider: LLMProvider) => {
    if (confirm(`Remove API key for ${LLM_PROVIDERS[provider].name}?`)) {
      removeApiKey(provider);
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKey((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content api-key-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🔑 API Key Manager</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="manager-description">
            Manage your API keys for different LLM providers. Keys are stored locally in your browser.
          </p>

          <div className="provider-list">
            {PROVIDER_ORDER.map((providerId) => {
              const provider = LLM_PROVIDERS[providerId];
              const hasKey = hasApiKey(providerId);
              const isEditing = editingProvider === providerId;

              return (
                <div key={providerId} className={`provider-row ${hasKey ? "has-key" : ""}`}>
                  <div className="provider-info">
                    <span
                      className="provider-icon-large"
                      style={{ background: provider.bgColor }}
                    >
                      {provider.icon}
                    </span>
                    <div className="provider-details">
                      <span className="provider-name">{provider.name}</span>
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="provider-docs"
                      >
                        Get API Key →
                      </a>
                    </div>
                  </div>

                  <div className="provider-key-section">
                    {isEditing ? (
                      <div className="key-edit-form">
                        <input
                          type={showKey[providerId] ? "text" : "password"}
                          className="form-input-small"
                          placeholder={provider.apiKeyPlaceholder}
                          value={tempKey}
                          onChange={(e) => setTempKey(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn-icon-small"
                          onClick={() => toggleShowKey(providerId)}
                        >
                          {showKey[providerId] ? "🙈" : "👁️"}
                        </button>
                        <button
                          className="btn-save-small"
                          onClick={() => handleSaveKey(providerId)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-cancel-small"
                          onClick={() => {
                            setEditingProvider(null);
                            setTempKey("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : hasKey ? (
                      <div className="key-display">
                        <span className="key-masked">
                          {showKey[providerId] ? keys[providerId] : maskKey(keys[providerId] || "")}
                        </span>
                        <button
                          className="btn-icon-small"
                          onClick={() => toggleShowKey(providerId)}
                        >
                          {showKey[providerId] ? "🙈" : "👁️"}
                        </button>
                        <button
                          className="btn-icon-small"
                          onClick={() => handleEditKey(providerId)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-small danger"
                          onClick={() => handleRemoveKey(providerId)}
                        >
                          🗑️
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add-key"
                        onClick={() => handleEditKey(providerId)}
                      >
                        + Add Key
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="manager-footer-note">
            <span className="note-icon">ℹ️</span>
            <span>
              API keys are stored locally in your browser and never sent to our servers.
              For production use, consider using environment variables.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;