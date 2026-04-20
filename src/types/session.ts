export type SessionStatus = "active" | "ended";

export interface Session {
  sessionId: string;
  status: SessionStatus;
  createdAt: string;
  endedAt: string | null;
}

export interface SessionMessage {
  messageId: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
