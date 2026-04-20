import { query } from "../db";
import { ChatResponseBody } from "../types/chat";

export async function saveMetric(sessionId: string, meta: ChatResponseBody["meta"]): Promise<void> {
  await query(
    `
      INSERT INTO metrics (session_id, response_time_ms, reply_length, user_message_length, message_count)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [sessionId, meta.responseTime, meta.length, meta.userMessageLength, meta.messageCount]
  );
}
