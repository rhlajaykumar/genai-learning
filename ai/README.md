# AI Playground

FastAPI service for auth, RAG agents, chat, traces, and evals placeholders.

**Default LLM:** local **Ollama** (`nomic-embed-text` + `llama3.1`).

## Setup

```bash
# Ensure Ollama is running with models:
#   ollama pull nomic-embed-text
#   ollama pull llama3.1

# From repo root — start Postgres + migrate
cd db
cp .env.example .env
docker compose up -d
./scripts/migrate.ps1   # or ./scripts/migrate.sh

cd ../ai
cp .env.example .env
uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000
```

### LLM config (`.env`)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
TEXT_MODEL=llama3.1:latest
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIM=768
```

Other providers: `LLM_PROVIDER=google` (needs `GOOGLE_API_KEY`) or `fake` for offline stubs.

If you previously ingested docs with fake/Google embeddings, **re-upload** them so chunks match Ollama vectors.

## Key APIs

- `POST /auth/signup` `{username, password}`
- `POST /auth/login`
- `POST /agents` `{name, system_instruction}`
- `POST /agents/{id}/documents` (multipart file)
- `POST /sessions` → `POST /sessions/{id}/chat`
- `GET /agents/{id}/traces`
- `GET /agents/{id}/evals` (placeholder)

## Retriever (Neo4j-ready)

All RAG goes through `app/rag` (`Retriever` protocol + `get_retriever()`).

- v1: `RETRIEVER_BACKEND=pgvector`
- later: implement `app/rag/neo4j.py`, set `RETRIEVER_BACKEND=neo4j`, re-ingest originals from `documents.storage_path`
