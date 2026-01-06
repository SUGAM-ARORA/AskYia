// frontend/src/components/common/KeyboardShortcutsModal.tsx
import { formatShortcut, groupShortcutsByCategory } from "../../hooks/useKeyboardShortcuts";
import "../../styles/Modal.css";
import "../../styles/KeyboardShortcuts.css";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category?: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

const KeyboardShortcutsModal = ({ 
  isOpen, 
  onClose, 
  shortcuts 
}: KeyboardShortcutsModalProps) => {
  if (!isOpen) return null;

  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-shortcuts glass-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">⌨️</span>
            <h2 className="modal-title">Keyboard Shortcuts</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body shortcuts-body">
          <p className="shortcuts-hint">
            Press <kbd>?</kbd> anywhere to toggle this dialog
          </p>

          <div className="shortcuts-grid">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="shortcuts-category">
                <h3 className="category-title">{category}</h3>
                <div className="shortcuts-list">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <span className="shortcut-description">{shortcut.description}</span>
                      <kbd className="shortcut-keys">{formatShortcut(shortcut)}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;