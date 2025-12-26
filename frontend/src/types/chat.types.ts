export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  createdAt: number;
}
