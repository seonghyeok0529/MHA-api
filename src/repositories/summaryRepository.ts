import { query } from "../db";

export interface Summary {
  summaryId: string;
  sessionId: string;
  content: string;
  createdAt: string;
}

interface SummaryRow {
  summary_id: string;
  session_id: string;
  content: string;
  created_at: Date;
}

function mapSummary(row: SummaryRow): Summary {
  return {
    summaryId: row.summary_id,
    sessionId: row.session_id,
    content: row.content,
    createdAt: row.created_at.toISOString()
  };
}

export async function addSummary(sessionId: string, content: string): Promise<Summary> {
  const result = await query<SummaryRow>(
    `INSERT INTO summaries (session_id, content)
     VALUES ($1, $2)
     RETURNING summary_id, session_id, content, created_at`,
    [sessionId, content]
  );

  return mapSummary(result.rows[0]);
}
