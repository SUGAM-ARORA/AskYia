import { useState } from "react";
import { useStackStore } from "../../store/stackSlice";
import { v4 as uuidv4 } from "uuid";
import "../../styles/Modal.css";

interface CreateStackModalProps {
  onClose: () => void;
}

const CreateStackModal = ({ onClose }: CreateStackModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { addStack } = useStackStore();

  const handleCreate = () => {
    if (!name.trim()) return;

    const newStack = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addStack(newStack);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Stack</h2>
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
              placeholder="Chat With PDF"
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
              placeholder="Chat with your pdf docs"
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
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStackModal;
