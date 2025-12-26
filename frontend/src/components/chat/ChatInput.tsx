import { useState } from "react";
import Button from "../common/Button";

const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a question"
        style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #1f2937", background: "#0b1221", color: "#e5e7eb" }}
      />
      <Button onClick={submit}>Send</Button>
    </div>
  );
};

export default ChatInput;
