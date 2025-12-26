import { useChatStore } from "../store/chatSlice";
import { ChatMessage } from "../types/chat.types";
import { v4 as uuid } from "uuid";

export const useChat = () => {
  const { messages, addMessage, reset } = useChatStore();

  const pushUserMessage = (content: string) => {
    const msg: ChatMessage = { id: uuid(), sender: "user", content, createdAt: Date.now() };
    addMessage(msg);
  };

  const pushAssistantMessage = (content: string) => {
    const msg: ChatMessage = { id: uuid(), sender: "assistant", content, createdAt: Date.now() };
    addMessage(msg);
  };

  return { messages, pushUserMessage, pushAssistantMessage, reset };
};
