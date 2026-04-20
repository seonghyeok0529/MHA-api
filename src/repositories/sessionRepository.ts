import { query } from "../db";
import { Session } from "../types/session";

interface SessionRow {
  session_id: string;
  status: "active" | "ended";
  created_at: Date;
  ended_at: Date | null;
}

function mapSession(row: SessionRow): Session {
  return {
    sessionId: row.session_id,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    endedAt: row.ended_at ? row.ended_at.toISOString() : null
  };
}

export async function createSession(): Promise<Session> {
  const result = await query<SessionRow>(
    `INSERT INTO sessions DEFAULT VALUES
     RETURNING session_id, status, created_at, ended_at`
  );

  return mapSession(result.rows[0]);
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const result = await query<SessionRow>(
    `SELECT session_id, status, created_at, ended_at
     FROM sessions
     WHERE session_id = $1`,
    [sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapSession(result.rows[0]);
}

export async function endSession(sessionId: string): Promise<Session | null> {
  const result = await query<SessionRow>(
    `UPDATE sessions
     SET status = 'ended', ended_at = NOW()
     WHERE session_id = $1
     RETURNING session_id, status, created_at, ended_at`,
    [sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapSession(result.rows[0]);
}
