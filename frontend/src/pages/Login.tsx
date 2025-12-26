import LoginForm from "../components/auth/LoginForm";

const Login = () => {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <div style={{ background: "#0b1221", padding: 24, borderRadius: 12, border: "1px solid #1f2937" }}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
