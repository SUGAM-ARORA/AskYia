import { useState, useRef } from "react";
import "../../styles/Modal.css";

interface Template {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}

interface ImportConfigModalProps {
  templates: Template[];
  onImportTemplate: (template: Template) => void;
  onImportJSON: (config: { nodes: any[]; edges: any[] }) => void;
  onClose: () => void;
}

const ImportConfigModal = ({
  templates,
  onImportTemplate,
  onImportJSON,
  onClose,
}: ImportConfigModalProps) => {
  const [activeTab, setActiveTab] = useState<"templates" | "json">("templates");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.nodes && config.edges) {
          onImportJSON(config);
          setJsonError(null);
        } else {
          setJsonError("Invalid config file. Must contain 'nodes' and 'edges'.");
        }
      } catch (err) {
        setJsonError("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Import Configuration</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="import-tabs">
          <button
            className={`import-tab ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            📋 Templates
          </button>
          <button
            className={`import-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📄 JSON File
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "templates" ? (
            <div className="template-grid">
              {templates.map((template, index) => (
                <div key={index} className="template-card">
                  <div className="template-icon">
                    {template.name === "Simple Chat" && "💬"}
                    {template.name === "PDF Chat" && "📄"}
                    {template.name === "Web Search Agent" && "🌐"}
                  </div>
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-description">{template.description}</p>
                  <div className="template-meta">
                    <span>{template.nodes.length} nodes</span>
                    <span>{template.edges.length} connections</span>
                  </div>
                  <button
                    className="btn-use-template"
                    onClick={() => onImportTemplate(template)}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="json-import">
              <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                <div className="drop-icon">📁</div>
                <p>Click to upload or drag & drop</p>
                <span className="file-types">JSON files only</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>
              {jsonError && <div className="json-error">⚠️ {jsonError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportConfigModal;