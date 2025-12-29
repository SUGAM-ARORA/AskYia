import { useState } from "react";
import { useStackStore, Stack } from "../../store/stackSlice";
import "../../styles/Modal.css";

interface EditStackModalProps {
  stack: Stack;
  onClose: () => void;
}

const EditStackModal = ({ stack, onClose }: EditStackModalProps) => {
  const [name, setName] = useState(stack.name);
  const [description, setDescription] = useState(stack.description);
  const { updateStack } = useStackStore();

  const handleSave = () => {
    if (!name.trim()) return;

    updateStack(stack.id, {
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date(),
    });
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
          <h2 className="modal-title">Edit Stack</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Stack name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Stack description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStackModal;