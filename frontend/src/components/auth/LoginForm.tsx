import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/LoginForm.css";

const LoginForm = () => {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submit();
    }
  };

  return (
    <div className="login-form">
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          className="form-input"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          className="form-input"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button className="btn-login" onClick={submit} disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
};

export default LoginForm;
