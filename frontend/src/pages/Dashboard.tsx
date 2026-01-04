import { useState } from "react";
import { useStackStore, Stack } from "../store/stackSlice";
import CreateStackModal from "../components/common/CreateStackModal";
import EditStackModal from "../components/common/EditStackModal";
import UserMenu from "../components/common/UserMenu";
import Logo from "../components/common/Logo";
import ThemeToggle from "../components/common/ThemeToggle";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { stacks, setCurrentStack, deleteStack } = useStackStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<Stack | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleEditStack = (stack: Stack) => {
    setCurrentStack(stack);
    window.location.hash = "workflow";
  };

  const handleOpenEditModal = (stack: Stack) => {
    setEditingStack(stack);
    setMenuOpenId(null);
  };

  const handleDeleteStack = (id: string) => {
    if (confirm("Are you sure you want to delete this stack?")) {
      deleteStack(id);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <Logo size={32} showText={true} />
        </div>
        <div className="header-right">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-controls">
          <h2 className="dashboard-title">My Stacks</h2>
          <button className="btn-new-stack" onClick={() => setIsCreateModalOpen(true)}>
            + New Stack
          </button>
        </div>

        {/* Horizontal divider */}
        <div className="dashboard-divider"></div>

        {stacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-card">
              <h3>Create New Stack</h3>
              <p>Start building your generative AI apps with AskYia (our essential tools and components).</p>
              <button 
                className="btn-new-stack-large" 
                onClick={() => setIsCreateModalOpen(true)}
              >
                + New Stack
              </button>
            </div>
          </div>
        ) : (
          <div className="stack-grid">
            {stacks.map((stack) => (
              <div key={stack.id} className="stack-card">
                <div className="stack-card-header">
                  <h3 className="stack-card-title">{stack.name}</h3>
                  <div className="stack-card-menu">
                    <button 
                      className="stack-card-menu-btn"
                      onClick={() => setMenuOpenId(menuOpenId === stack.id ? null : stack.id)}
                    >
                      ⋮
                    </button>
                    {menuOpenId === stack.id && (
                      <div className="stack-card-dropdown">
                        <button 
                          className="stack-card-dropdown-item"
                          onClick={() => handleOpenEditModal(stack)}
                        >
                          ✏️ Edit Details
                        </button>
                        <button 
                          className="stack-card-dropdown-item danger"
                          onClick={() => handleDeleteStack(stack.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="stack-card-description">
                  {stack.description || "No description"}
                </p>
                <div className="stack-card-actions">
                  <button
                    className="stack-card-action primary"
                    onClick={() => handleEditStack(stack)}
                  >
                    Open Stack →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isCreateModalOpen && (
        <CreateStackModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      
      {editingStack && (
        <EditStackModal 
          stack={editingStack} 
          onClose={() => setEditingStack(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;