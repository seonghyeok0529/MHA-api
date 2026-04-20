-- MHA-api PostgreSQL schema
-- Apply on Render Postgres with:
-- psql "$DATABASE_URL" -f sql/schema.sql

BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id_created_at
  ON messages (session_id, created_at);

COMMIT;
