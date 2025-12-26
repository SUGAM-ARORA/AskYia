import { useState } from "react";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

const LoginForm = () => {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    await loginWithEmail(email, password);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 320 }}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #1f2937", background: "#0b1221", color: "#e5e7eb" }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #1f2937", background: "#0b1221", color: "#e5e7eb" }}
      />
      <Button onClick={submit}>Login</Button>
    </div>
  );
};

export default LoginForm;
