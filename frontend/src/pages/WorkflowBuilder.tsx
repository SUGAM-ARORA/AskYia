import ComponentLibrary from "../components/panels/ComponentLibrary";
import WorkspacePanel from "../components/panels/WorkspacePanel";
import ConfigurationPanel from "../components/panels/ConfigurationPanel";
import ExecutionControls from "../components/panels/ExecutionControls";

const WorkflowBuilder = () => {
  return (
    <div style={{ display: "flex", height: "70vh", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937" }}>
      <ComponentLibrary />
      <WorkspacePanel />
      <ConfigurationPanel />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <ExecutionControls />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
