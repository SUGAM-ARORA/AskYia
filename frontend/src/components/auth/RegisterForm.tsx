// frontend/src/components/auth/RegisterForm.tsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/LoginForm.css";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const { registerWithEmail, loginWithGoogle, loginWithGitHub, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

    // Validate
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
      await registerWithEmail(email, password, fullName || undefined);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    try {
      await loginWithGoogle();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGitHubLogin = async () => {
    clearError();
    try {
      await loginWithGitHub();
    } catch {
      // Error is handled by the hook
    }
  };

  const isFormValid = 
    email && 
    password && 
    confirmPassword && 
    password === confirmPassword && 
    validatePassword(password).length === 0;

  return (
    <div className="auth-form">
      {/* OAuth Buttons */}
      <div className="oauth-buttons">
        <button
          type="button"
          className="oauth-btn oauth-google"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="oauth-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>
        
        <button
          type="button"
          className="oauth-btn oauth-github"
          onClick={handleGitHubLogin}
          disabled={isLoading}
        >
          <svg className="oauth-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign up with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="auth-divider">
        <span>or create account with email</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="auth-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-dismiss" onClick={clearError}>×</button>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">Full Name <span className="optional">(optional)</span></label>
          <input
            className="form-input"
            placeholder="Enter your full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="password-input-wrapper">
            <input
              className="form-input"
              placeholder="Create a password"
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
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Password Requirements */}
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
            placeholder="Confirm your password"
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Terms */}
      <p className="auth-terms">
        By creating an account, you agree to our{" "}
        <a href="/terms" target="_blank">Terms of Service</a> and{" "}
        <a href="/privacy" target="_blank">Privacy Policy</a>
      </p>

      {/* Switch to Login */}
      <div className="auth-switch">
        <span>Already have an account?</span>
        <button type="button" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;