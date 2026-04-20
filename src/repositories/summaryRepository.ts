import { query } from "../db";

export interface SessionSummary {
  summaryId: string;
  sessionId: string;
  summaryText: string;
  createdAt: string;
}

interface SummaryRow {
  summary_id: string;
  session_id: string;
  summary_text: string;
  created_at: Date;
}

function mapSummary(row: SummaryRow): SessionSummary {
  return {
    summaryId: row.summary_id,
    sessionId: row.session_id,
    summaryText: row.summary_text,
    createdAt: row.created_at.toISOString()
  };
}

export async function saveSummary(sessionId: string, summaryText: string): Promise<SessionSummary> {
  const result = await query<SummaryRow>(
    `
      INSERT INTO summaries (session_id, summary_text)
      VALUES ($1, $2)
      RETURNING summary_id, session_id, summary_text, created_at
    `,
    [sessionId, summaryText]
  );

  return mapSummary(result.rows[0]);
}
