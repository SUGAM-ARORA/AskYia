// frontend/src/pages/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/common/Logo";
import "../styles/Login.css";
import "../styles/LoginForm.css";

const ResetPassword = () => {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const validatePassword = (pass: string): string[] => {
    const errors: string[] = [];
    if (pass.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pass)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pass)) errors.push("One lowercase letter");
    if (!/\d/.test(pass)) errors.push("One number");
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setValidationErrors(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const passErrors = validatePassword(password);
    if (passErrors.length > 0) {
      setValidationErrors(passErrors);
      return;
    }

    if (password !== confirmPassword) {
      setValidationErrors(["Passwords do not match"]);
      return;
    }

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch {
      // Error handled by hook
    }
  };

  const isFormValid = 
    password && 
    confirmPassword && 
    password === confirmPassword && 
    validatePassword(password).length === 0;

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size={40} showText={true} />
          </div>
          <div className="auth-form">
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <h3>Invalid Reset Link</h3>
              <p>This password reset link is invalid or has expired.</p>
            </div>
            <button 
              className="btn-login" 
              onClick={() => window.location.href = "/"}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size={40} showText={true} />
          </div>
          <div className="auth-form">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Password Reset Successful</h3>
              <p>Your password has been reset. You can now sign in with your new password.</p>
            </div>
            <button 
              className="btn-login" 
              onClick={() => window.location.href = "/"}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Logo size={40} showText={true} />
        </div>
        <h2 className="login-title">Create new password</h2>
        <p className="login-subtitle">Enter your new password below</p>

        <div className="auth-form">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button className="error-dismiss" onClick={clearError}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  placeholder="Enter new password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
              
              {password && (
                <div className="password-requirements">
                  <div className={`requirement ${password.length >= 8 ? 'met' : ''}`}>
                    <span className="check">{password.length >= 8 ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`requirement ${/[A-Z]/.test(password) ? 'met' : ''}`}>
                    <span className="check">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                    One uppercase letter
                  </div>
                  <div className={`requirement ${/[a-z]/.test(password) ? 'met' : ''}`}>
                    <span className="check">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                    One lowercase letter
                  </div>
                  <div className={`requirement ${/\d/.test(password) ? 'met' : ''}`}>
                    <span className="check">{/\d/.test(password) ? '✓' : '○'}</span>
                    One number
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className={`form-input ${confirmPassword && password !== confirmPassword ? 'error' : ''}`}
                placeholder="Confirm new password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="field-error">Passwords do not match</span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-login" 
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;