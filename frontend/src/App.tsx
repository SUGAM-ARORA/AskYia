import WorkflowBuilder from "./pages/WorkflowBuilder";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useAuthStore } from "./store/authSlice";

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #1f2937" }}>
        <h1 style={{ margin: 0, fontSize: "18px" }}>Askyia</h1>
      </header>
      <Dashboard />
      <WorkflowBuilder />
    </div>
  );
}

export default App;
