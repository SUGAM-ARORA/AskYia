import { Handle, Position } from "reactflow";
import { useState } from "react";
import { KnowledgeBaseNodeData } from "../../types/node.types";
import "../../styles/Nodes.css";

const KnowledgeBaseNode = ({ data }: { data: KnowledgeBaseNodeData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [file, setFile] = useState<File | string | null>(data.file || null);
  const [embeddingModel, setEmbeddingModel] = useState(
    data.embeddingModel || "text-embedding-3-large"
  );
  const [apiKey, setApiKey] = useState(data.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleUpdate = (updates: Partial<KnowledgeBaseNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      handleUpdate({ file: uploadedFile });
    }
  };

  return (
    <div className="custom-node knowledge-node">
      <div className="node-header">
        <div className="node-title">
          <span className="node-icon">📚</span>
          <span>Knowledge Base</span>
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
          <p className="node-description">Let LLM search info in your file</p>

          <div className="form-group">
            <label className="form-label-small">File for Knowledge</label>
            <label className="file-upload-label">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <div className={`file-upload-button ${file ? "has-file" : ""}`}>
                {file ? (
                  <span>📄 {typeof file === "string" ? file : file.name}</span>
                ) : (
                  <span>Upload File 📤</span>
                )}
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label-small">Embedding Model</label>
            <select
              className="form-select"
              value={embeddingModel}
              onChange={(e) => {
                setEmbeddingModel(e.target.value);
                handleUpdate({ embeddingModel: e.target.value });
              }}
            >
              <option value="text-embedding-3-large">text-embedding-3-large</option>
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002</option>
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
        </div>
      )}

      {/* Footer with Handles - Query on bottom left, Context on bottom right */}
      <div className="node-footer">
        <div className="footer-handle">
          <span className="footer-handle-label">Query</span>
          <Handle
            type="target"
            position={Position.Bottom}
            id="query"
            className="handle-orange"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
        <div className="footer-handle">
          <span className="footer-handle-label">Context</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="context"
            className="handle-orange"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseNode;