import { useState } from "react";
import Button from "../common/Button";
import { useWorkflow } from "../../hooks/useWorkflow";
import { validateWorkflow } from "../../services/workflowService";
import ChatInterface from "../chat/ChatInterface";

const ExecutionControls = () => {
  const { getDefinition } = useWorkflow();
  const [chatOpen, setChatOpen] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  const handleValidate = async () => {
    const def = getDefinition();
    const result = await validateWorkflow(def);
    setValidation(result.valid ? "Workflow is valid" : result.reason || "Invalid workflow");
  };

  const handleChat = () => setChatOpen(true);

  return (
    <div style={{ padding: 12, borderTop: "1px solid #1f2937", display: "flex", gap: 10, alignItems: "center" }}>
      <Button onClick={handleValidate}>Build Stack</Button>
      <Button onClick={handleChat}>Chat with Stack</Button>
      {validation && <span style={{ opacity: 0.8 }}>{validation}</span>}
      <ChatInterface open={chatOpen} onClose={() => setChatOpen(false)} definition={getDefinition()} />
    </div>
  );
};

export default ExecutionControls;
