import { useWorkflow } from "../../hooks/useWorkflow";
import { Node } from "reactflow";
import Button from "../common/Button";

const templates: { type: Node["type"]; label: string }[] = [
  { type: "userQuery", label: "User Query" },
  { type: "knowledgeBase", label: "Knowledge Base" },
  { type: "llmEngine", label: "LLM Engine" },
  { type: "output", label: "Output" },
];

const ComponentLibrary = () => {
  const { nodes, setNodes } = useWorkflow();

  const addNode = (type: Node["type"], label: string) => {
    const id = `${type}-${nodes.length + 1}`;
    const node: Node = {
      id,
      type,
      data: { label },
      position: { x: Math.random() * 400, y: Math.random() * 200 },
    };
    setNodes([...nodes, node]);
  };

  return (
    <div style={{ padding: 12, borderRight: "1px solid #1f2937", width: 240 }}>
      <h3 style={{ marginTop: 0 }}>Components</h3>
      {templates.map((t) => (
        <div key={t.type} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{t.label}</span>
          <Button onClick={() => addNode(t.type, t.label)}>Add</Button>
        </div>
      ))}
    </div>
  );
};

export default ComponentLibrary;
