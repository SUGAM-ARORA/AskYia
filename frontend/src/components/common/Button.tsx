import { ButtonHTMLAttributes } from "react";

const Button = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #1f2937",
      background: "#2563eb",
      color: "white",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    {children}
  </button>
);

export default Button;
