// frontend/src/pages/Login.tsx
import { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import Logo from "../components/common/Logo";
import ThemeToggle from "../components/common/ThemeToggle";
import "../styles/Login.css";

type AuthView = "login" | "register" | "forgot-password";

const Login = () => {
  const [view, setView] = useState<AuthView>("login");

  const getTitle = () => {
    switch (view) {
      case "register":
        return "Create your account";
      case "forgot-password":
        return "Reset password";
      default:
        return "Welcome back";
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case "register":
        return "Start building AI workflows in minutes";
      case "forgot-password":
        return "";
      default:
        return "Sign in to continue building AI stacks";
    }
  };

  return (
    <div className="login-container">
      {/* Theme Toggle */}
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-card">
        <div className="login-header">
          <Logo size={40} showText={true} />
        </div>
        
        {view !== "forgot-password" && (
          <>
            <h2 className="login-title">{getTitle()}</h2>
            <p className="login-subtitle">{getSubtitle()}</p>
          </>
        )}

        {view === "login" && (
          <LoginForm
            onSwitchToRegister={() => setView("register")}
            onForgotPassword={() => setView("forgot-password")}
          />
        )}

        {view === "register" && (
          <RegisterForm
            onSwitchToLogin={() => setView("login")}
          />
        )}

        {view === "forgot-password" && (
          <ForgotPasswordForm
            onBack={() => setView("login")}
          />
        )}
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>© 2025 Askyia. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;