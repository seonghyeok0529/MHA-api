import { query } from "../db";
import { MentalHealthReport } from "../types/report";

interface MentalHealthReportRow {
  session_id: string;
  message_digest: string;
  message_count: number;
  report_json: MentalHealthReport;
}

export interface CachedMentalHealthReport {
  sessionId: string;
  messageDigest: string;
  messageCount: number;
  report: MentalHealthReport;
}

function mapCachedReport(row: MentalHealthReportRow): CachedMentalHealthReport {
  return {
    sessionId: row.session_id,
    messageDigest: row.message_digest,
    messageCount: row.message_count,
    report: row.report_json
  };
}

export async function getCachedMentalHealthReport(
  sessionId: string
): Promise<CachedMentalHealthReport | null> {
  const result = await query<MentalHealthReportRow>(
    `
      SELECT session_id, message_digest, message_count, report_json
      FROM mental_health_reports
      WHERE session_id = $1
    `,
    [sessionId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapCachedReport(result.rows[0]);
}

export async function saveMentalHealthReport(
  sessionId: string,
  messageDigest: string,
  messageCount: number,
  report: MentalHealthReport
): Promise<void> {
  await query(
    `
      INSERT INTO mental_health_reports (
        session_id,
        message_digest,
        message_count,
        report_json,
        updated_at
      )
      VALUES ($1, $2, $3, $4::jsonb, NOW())
      ON CONFLICT (session_id)
      DO UPDATE SET
        message_digest = EXCLUDED.message_digest,
        message_count = EXCLUDED.message_count,
        report_json = EXCLUDED.report_json,
        updated_at = NOW()
    `,
    [sessionId, messageDigest, messageCount, JSON.stringify(report)]
  );
}
