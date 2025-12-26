import { Handle, Position } from "reactflow";

interface BaseNodeProps {
  label: string;
  color?: string;
}

const BaseNode = ({ label, color = "#2563eb" }: BaseNodeProps) => {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: color, color: "#fff", minWidth: 160 }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default BaseNode;
