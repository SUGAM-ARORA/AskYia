// frontend/src/components/auth/ForgotPasswordForm.tsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/LoginForm.css";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    await requestPasswordReset(email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="auth-form">
        <div className="success-message">
          <div className="success-icon">✉️</div>
          <h3>Check your email</h3>
          <p>
            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <p className="hint">
            Don't see it? Check your spam folder.
          </p>
        </div>
        
        <button type="button" className="btn-login" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div className="form-header">
        <h3>Reset your password</h3>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
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
            autoFocus
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn-login" 
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div className="auth-switch">
        <button type="button" onClick={onBack}>
          ← Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;