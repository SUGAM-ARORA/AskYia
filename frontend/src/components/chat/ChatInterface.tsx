import { useState } from "react";
import Modal from "../common/Modal";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "../../hooks/useChat";
import { askWorkflow } from "../../services/chatService";
import { WorkflowDefinition } from "../../types/workflow.types";

interface Props {
  open: boolean;
  onClose: () => void;
  definition: WorkflowDefinition;
}

const ChatInterface = ({ open, onClose, definition }: Props) => {
  const { messages, pushAssistantMessage, pushUserMessage } = useChat();
  const [pending, setPending] = useState(false);

  const handleSend = async (text: string) => {
    pushUserMessage(text);
    setPending(true);
    try {
      const answer = await askWorkflow(definition, text);
      pushAssistantMessage(answer ?? "No answer");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chat with Stack">
      <div style={{ maxHeight: 360, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {pending && <div style={{ opacity: 0.6 }}>Thinking...</div>}
      </div>
      <ChatInput onSend={handleSend} />
    </Modal>
  );
};

export default ChatInterface;
