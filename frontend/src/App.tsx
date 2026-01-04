import { useState, useEffect } from "react";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useAuthStore } from "./store/authSlice";
import { useThemeStore } from "./store/themeSlice";

function App() {
  const { isAuthenticated } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const [currentView, setCurrentView] = useState<"dashboard" | "workflow">("dashboard");

  // Initialize theme on mount
  useEffect(() => {
    // Theme is initialized by Zustand persist, but ensure it's applied
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

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