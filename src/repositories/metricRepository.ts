import { PoolClient } from "pg";
import { query } from "../db";
import { ChatResponseBody } from "../types/chat";

export async function saveMetric(
  sessionId: string,
  meta: ChatResponseBody["meta"],
  client?: PoolClient
): Promise<void> {
  const dbQuery = client ? client.query.bind(client) : query;

  console.info("[metricRepository.saveMetric] insert:start", {
    sessionId,
    responseTime: meta.responseTime,
    replyLength: meta.length,
    userMessageLength: meta.userMessageLength,
    messageCount: meta.messageCount,
    viaTransaction: Boolean(client)
  });

  await dbQuery(
    `
      INSERT INTO metrics (session_id, response_time_ms, reply_length, user_message_length, message_count)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [sessionId, meta.responseTime, meta.length, meta.userMessageLength, meta.messageCount]
  );

  console.info("[metricRepository.saveMetric] insert:success", {
    sessionId
  });
}
