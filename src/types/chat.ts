export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestBody {
  sessionId: string;
  messages: ChatMessage[];
}

export interface ChatResponseBody {
  reply: string;
  meta: {
    responseTime: number;
    length: number;
    userMessageLength: number;
    messageCount: number;
  };
}
