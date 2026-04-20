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

CREATE TABLE IF NOT EXISTS summaries (
  summary_id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions (session_id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  metric_id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions (session_id) ON DELETE CASCADE,
  response_time_ms INTEGER NOT NULL,
  reply_length INTEGER NOT NULL,
  user_message_length INTEGER NOT NULL,
  message_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
