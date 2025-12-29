import LoginForm from "../components/auth/LoginForm";
import Logo from "../components/common/Logo";
import "../styles/Login.css";

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Logo size={40} showText={true} />
        </div>
        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to continue building AI stacks</p>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;