-- Playground schema for the AI service (auth, agents, RAG, chat, traces).
-- Source of truth for DDL; mirrored by ai/app/models.

CREATE SCHEMA IF NOT EXISTS playground;

CREATE TABLE playground.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE playground.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES playground.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_instruction TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX agents_owner_user_id_idx ON playground.agents (owner_user_id);

CREATE TABLE playground.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES playground.agents (id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_type TEXT,
    checksum TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_agent_id_idx ON playground.documents (agent_id);

-- embedding dim must match EMBEDDING_DIM (default: text-embedding-004 → 768)
CREATE TABLE playground.chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES playground.documents (id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES playground.agents (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    chunk_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chunks_agent_id_idx ON playground.chunks (agent_id);
CREATE INDEX chunks_document_id_idx ON playground.chunks (document_id);
CREATE INDEX chunks_embedding_hnsw_idx ON playground.chunks
    USING hnsw (embedding vector_cosine_ops);

CREATE TABLE playground.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES playground.agents (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES playground.users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_sessions_agent_user_idx ON playground.chat_sessions (agent_id, user_id);

CREATE TABLE playground.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES playground.chat_sessions (id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_id_idx ON playground.chat_messages (session_id);

CREATE TABLE playground.interaction_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES playground.chat_sessions (id) ON DELETE CASCADE,
    message_id UUID REFERENCES playground.chat_messages (id) ON DELETE SET NULL,
    latency_ms INT,
    retrieved_chunk_ids UUID[] NOT NULL DEFAULT '{}',
    model TEXT,
    error TEXT,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX interaction_traces_session_id_idx ON playground.interaction_traces (session_id);

CREATE TABLE playground.evals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES playground.agents (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'coming_soon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evals_agent_id_idx ON playground.evals (agent_id);
