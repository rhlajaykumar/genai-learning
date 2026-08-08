# genai-learning

AI Playground monorepo: configure RAG agents, chat with them, inspect traces, and grow into evals / graph RAG later.

## Stack

- **Backend**: Python + FastAPI (`ai/`) via `uv`
- **Frontend**: Next.js App Router (`web/`)
- **LLM**: Ollama by default (`nomic-embed-text` + `llama3.1`)
- **Data**: PostgreSQL + pgvector (`db/`)
- **RAG**: Option 3 — vector RAG now; `Retriever` abstraction for Neo4j later

## Directories

| Path | Purpose |
|------|---------|
| `ai/` | Playground API (auth, agents, RAG, chat, traces, evals stub) |
| `web/` | User UI |
| `db/` | Postgres Docker + SQL migrations |
| `docs/adr/` | Architecture decisions |
| `.cursor/rules/` | Agent rules |

## Quick start

```bash
# DB
cd db && cp .env.example .env && docker compose up -d
./scripts/migrate.ps1   # or ./scripts/migrate.sh

# API
cd ai && cp .env.example .env && uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000

# UI
cd web && npm install && npm run dev
```

Open http://localhost:3000 — sign up, create an agent, upload docs, chat.
