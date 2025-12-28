import { useState } from "react";
import { useStackStore } from "../store/stackSlice";
import CreateStackModal from "../components/common/CreateStackModal";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { stacks, setCurrentStack } = useStackStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditStack = (stack: any) => {
    setCurrentStack(stack);
    // Navigate to workflow builder
    window.location.hash = "workflow";
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🟢</span>
            <span className="logo-text">AskYia</span>
          </div>
        </div>
        <div className="header-right">
          <button className="user-button">S</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-controls">
          <h2 className="dashboard-title">My Stacks</h2>
          <button className="btn-new-stack" onClick={() => setIsModalOpen(true)}>
            + New Stack
          </button>
        </div>

        {stacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-card">
              <h3>Create New Stack</h3>
              <p>Start building your generative AI apps...</p>
              <button className="btn-new-stack-large" onClick={() => setIsModalOpen(true)}>
                + New Stack
              </button>
            </div>
          </div>
        ) : (
          <div className="stack-grid">
            {stacks.map((stack) => (
              <div key={stack.id} className="stack-card">
                <h3 className="stack-card-title">{stack.name}</h3>
                <p className="stack-card-description">{stack.description}</p>
                <button
                  className="stack-card-action"
                  onClick={() => handleEditStack(stack)}
                >
                  Edit Stack ↗
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && <CreateStackModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Dashboard;