// frontend/src/App.tsx
import { useState, useEffect } from "react";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import OAuthCallback from "./pages/OAuthCallback";
import { useAuthStore } from "./store/authSlice";
import { useThemeStore } from "./store/themeSlice";

type AppView = "dashboard" | "workflow" | "reset-password" | "oauth-callback";

function App() {
  const { isAuthenticated, isTokenValid, logout } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const [currentView, setCurrentView] = useState<AppView>("dashboard");

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  // Check token validity on mount
  useEffect(() => {
    if (isAuthenticated && !isTokenValid()) {
      logout();
    }
  }, [isAuthenticated, isTokenValid, logout]);

  // Handle routing
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // Handle OAuth callback
      if (path.startsWith("/auth/callback")) {
        setCurrentView("oauth-callback");
        return;
      }

      // Handle password reset
      if (path === "/reset-password") {
        setCurrentView("reset-password");
        return;
      }

      // Handle hash-based routing for authenticated users
      if (hash === "#workflow") {
        setCurrentView("workflow");
      } else {
        setCurrentView("dashboard");
      }
    };

    handleRouteChange();
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Handle OAuth callback (no auth required)
  if (currentView === "oauth-callback") {
    return <OAuthCallback />;
  }

  // Handle password reset (no auth required)
  if (currentView === "reset-password") {
    return <ResetPassword />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Main app views
  return (
    <>
      {currentView === "dashboard" ? <Dashboard /> : <WorkflowBuilder />}
    </>
  );
}

export default App;