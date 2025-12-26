import { ChatMessage as ChatMessageType } from "../../types/chat.types";

const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  const isUser = message.sender === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser ? "#2563eb" : "#1f2937",
        color: "white",
        padding: "8px 12px",
        borderRadius: 12,
        maxWidth: "70%",
      }}
    >
      {message.content}
    </div>
  );
};

export default ChatMessage;
