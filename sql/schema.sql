-- MHA-api PostgreSQL schema
-- Render Postgres에서 그대로 실행할 수 있도록 idempotent(재실행 가능)하게 작성했습니다.

BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  CONSTRAINT sessions_status_check CHECK (status IN ('active', 'ended'))
);

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_session_id_fkey
    FOREIGN KEY (session_id)
    REFERENCES sessions (session_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id_created_at
  ON messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS metrics (
  metric_id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
  reply_length INTEGER NOT NULL CHECK (reply_length >= 0),
  user_message_length INTEGER NOT NULL CHECK (user_message_length >= 0),
  message_count INTEGER NOT NULL CHECK (message_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT metrics_session_id_fkey
    FOREIGN KEY (session_id)
    REFERENCES sessions (session_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_metrics_session_id_created_at
  ON metrics (session_id, created_at);

COMMIT;
