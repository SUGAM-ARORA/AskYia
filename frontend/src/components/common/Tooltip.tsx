import { ReactNode } from "react";

const Tooltip = ({ label, children }: { label: string; children: ReactNode }) => (
  <span title={label} style={{ cursor: "help" }}>
    {children}
  </span>
);

export default Tooltip;
