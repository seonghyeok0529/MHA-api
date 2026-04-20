import crypto from "crypto";
import { query } from "../db";
import { SessionMessage } from "../types/session";

interface MessageRow {
  message_id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

function mapMessage(row: MessageRow): SessionMessage {
  return {
    messageId: row.message_id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at.toISOString()
  };
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<SessionMessage> {
  const messageId = crypto.randomUUID();

  const result = await query<MessageRow>(
    `
      INSERT INTO messages (message_id, session_id, role, content)
      VALUES ($1, $2, $3, $4)
      RETURNING message_id, session_id, role, content, created_at
    `,
    [messageId, sessionId, role, content]
  );

  return mapMessage(result.rows[0]);
}

export async function getMessagesBySessionId(sessionId: string): Promise<SessionMessage[]> {
  const result = await query<MessageRow>(
    `
      SELECT message_id, session_id, role, content, created_at
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at ASC
    `,
    [sessionId]
  );

  return result.rows.map(mapMessage);
}
