import { useState, useEffect } from "react";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useAuthStore } from "./store/authSlice";

function App() {
  const { isAuthenticated } = useAuthStore();
  const [currentView, setCurrentView] = useState<"dashboard" | "workflow">("dashboard");

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#workflow") {
        setCurrentView("workflow");
      } else {
        setCurrentView("dashboard");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      {currentView === "dashboard" ? <Dashboard /> : <WorkflowBuilder />}
    </>
  );
}

export default App;
