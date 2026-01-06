// frontend/src/pages/OAuthCallback.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/common/Logo";
import "../styles/Login.css";

const OAuthCallback = () => {
  const { handleOAuthCallback, error } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const errorParam = params.get("error");

      // Determine provider from URL path
      const pathParts = window.location.pathname.split("/");
      const provider = pathParts[pathParts.length - 1] as "google" | "github";

      if (errorParam) {
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setIsProcessing(false);
        return;
      }

      try {
        await handleOAuthCallback(provider, code, state || undefined);
        // Redirect to dashboard on success
        window.location.href = "/";
      } catch {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleOAuthCallback]);

  if (isProcessing) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size={40} showText={true} />
          </div>
          <div className="oauth-processing">
            <div className="processing-spinner"></div>
            <h3>Completing sign in...</h3>
            <p>Please wait while we verify your account.</p>
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
        <div className="auth-form">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h3>Authentication Failed</h3>
            <p>{error || "Unable to complete sign in. Please try again."}</p>
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
};

export default OAuthCallback;