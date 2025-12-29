import { useState } from "react";
import { useStackStore, SavedWorkflow } from "../../store/stackSlice";
import { v4 as uuidv4 } from "uuid";
import "../../styles/Modal.css";

interface SaveWorkflowModalProps {
  nodes: any[];
  edges: any[];
  onClose: () => void;
  existingWorkflowId?: string;
}

const SaveWorkflowModal = ({ nodes, edges, onClose, existingWorkflowId }: SaveWorkflowModalProps) => {
  const { currentStack, addWorkflowToStack, updateWorkflowInStack } = useStackStore();
  const [name, setName] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(existingWorkflowId || null);
  const [saveMode, setSaveMode] = useState<"new" | "update">(existingWorkflowId ? "update" : "new");
  const [error, setError] = useState<string | null>(null);

  const existingWorkflows = currentStack?.workflows || [];

  const handleSave = () => {
    if (!currentStack) {
      setError("No stack selected");
      return;
    }

    setError(null);

    if (saveMode === "new") {
      if (!name.trim()) {
        setError("Please enter a workflow name");
        return;
      }
      
      // Check for unique name
      const nameExists = existingWorkflows.some(
        (w) => w.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (nameExists) {
        setError("A workflow with this name already exists. Please choose a different name.");
        return;
      }

      const newWorkflow: SavedWorkflow = {
        id: uuidv4(),
        name: name.trim(),
        nodes,
        edges,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addWorkflowToStack(currentStack.id, newWorkflow);
      alert("✅ Workflow saved successfully!");
    } else {
      if (!selectedWorkflowId) {
        setError("Please select a workflow to update");
        return;
      }
      
      updateWorkflowInStack(currentStack.id, selectedWorkflowId, {
        nodes,
        edges,
        updatedAt: new Date(),
      });
      alert("✅ Workflow updated successfully!");
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Save Workflow</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Stack Info */}
          <div className="save-workflow-info">
            <span className="info-label">Stack:</span>
            <span className="info-value">{currentStack?.name}</span>
          </div>

          {/* Save Mode Toggle */}
          <div className="form-group">
            <label className="form-label">Save Option</label>
            <div className="save-mode-options">
              <label className="save-mode-option">
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveMode === "new"}
                  onChange={() => {
                    setSaveMode("new");
                    setSelectedWorkflowId(null);
                    setError(null);
                  }}
                />
                <span className="option-icon">➕</span>
                <span>Save as New Workflow</span>
              </label>
              
              <label className={`save-mode-option ${existingWorkflows.length === 0 ? "disabled" : ""}`}>
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveMode === "update"}
                  disabled={existingWorkflows.length === 0}
                  onChange={() => {
                    setSaveMode("update");
                    setName("");
                    setError(null);
                  }}
                />
                <span className="option-icon">🔄</span>
                <span>Update Existing Workflow</span>
              </label>
            </div>
          </div>

          {/* New Workflow Name Input */}
          {saveMode === "new" && (
            <div className="form-group">
              <label className="form-label">Workflow Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., PDF Chat v1, Customer Support Flow"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <span className="form-hint">
                Name must be unique within this stack
              </span>
            </div>
          )}

          {/* Existing Workflow Selection */}
          {saveMode === "update" && (
            <div className="form-group">
              <label className="form-label">Select Workflow to Update</label>
              {existingWorkflows.length === 0 ? (
                <div className="no-workflows">
                  No existing workflows in this stack. Create a new one!
                </div>
              ) : (
                <div className="workflow-list">
                  {existingWorkflows.map((workflow) => (
                    <label
                      key={workflow.id}
                      className={`workflow-list-item ${selectedWorkflowId === workflow.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="selectedWorkflow"
                        checked={selectedWorkflowId === workflow.id}
                        onChange={() => {
                          setSelectedWorkflowId(workflow.id);
                          setError(null);
                        }}
                      />
                      <div className="workflow-item-info">
                        <span className="workflow-item-name">{workflow.name}</span>
                        <span className="workflow-item-meta">
                          {workflow.nodes?.length || 0} nodes • Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="form-error">
              ⚠️ {error}
            </div>
          )}

          {/* Workflow Stats */}
          <div className="workflow-stats">
            <div className="stat-item">
              <span className="stat-value">{nodes.length}</span>
              <span className="stat-label">Nodes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{edges.length}</span>
              <span className="stat-label">Connections</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={
              (saveMode === "new" && !name.trim()) ||
              (saveMode === "update" && !selectedWorkflowId)
            }
          >
            {saveMode === "new" ? "💾 Save New" : "🔄 Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveWorkflowModal;