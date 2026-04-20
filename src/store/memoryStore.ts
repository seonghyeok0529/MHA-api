import crypto from "crypto";
import { Session, SessionMessage } from "../types/session";

const sessions: Session[] = [];
const messages: SessionMessage[] = [];

export function createSession(): Session {
  const session: Session = {
    sessionId: crypto.randomUUID(),
    status: "active",
    createdAt: new Date().toISOString(),
    endedAt: null
  };

  sessions.push(session);
  return session;
}

export function getSessionById(sessionId: string): Session | undefined {
  return sessions.find((session) => session.sessionId === sessionId);
}

export function endSession(sessionId: string): Session | undefined {
  const session = getSessionById(sessionId);

  if (!session) {
    return undefined;
  }

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  return session;
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): SessionMessage {
  const message: SessionMessage = {
    messageId: crypto.randomUUID(),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString()
  };

  messages.push(message);
  return message;
}

export function getMessagesBySessionId(sessionId: string): SessionMessage[] {
  return messages.filter((message) => message.sessionId === sessionId);
}
