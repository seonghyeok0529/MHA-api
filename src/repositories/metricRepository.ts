import { query } from "../db";

export interface Metric {
  metricId: string;
  sessionId: string;
  metricType: string;
  metricValue: number;
  createdAt: string;
}

interface MetricRow {
  metric_id: string;
  session_id: string;
  metric_type: string;
  metric_value: number;
  created_at: Date;
}

function mapMetric(row: MetricRow): Metric {
  return {
    metricId: row.metric_id,
    sessionId: row.session_id,
    metricType: row.metric_type,
    metricValue: row.metric_value,
    createdAt: row.created_at.toISOString()
  };
}

export async function addMetric(sessionId: string, metricType: string, metricValue: number): Promise<Metric> {
  const result = await query<MetricRow>(
    `INSERT INTO metrics (session_id, metric_type, metric_value)
     VALUES ($1, $2, $3)
     RETURNING metric_id, session_id, metric_type, metric_value, created_at`,
    [sessionId, metricType, metricValue]
  );

  return mapMetric(result.rows[0]);
}
