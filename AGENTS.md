# Agent instructions

AI Playground monorepo: FastAPI + Next.js + Postgres/pgvector, Google ADK/GenAI for agents.

## Stack

- Python + **FastAPI** + **uv** (`ai/`)
- **Next.js** (`web/`)
- **PostgreSQL + pgvector** (`db/`)
- **Ollama** for local chat + embeddings (default); Google optional via `LLM_PROVIDER`
- RAG via **Retriever** protocol (`RETRIEVER_BACKEND=pgvector`; Neo4j later)

## Layout

| Path | Role |
|------|------|
| `ai/` | Playground API |
| `web/` | UI |
| `db/` | Postgres + migrations |
| `docs/adr/` | Decisions |

## How to work

1. Spec → 2. Plan → 3. Small implement → 4. Verify tests → 5. Definition of done

Follow `.cursor/rules/` (stack, microservices, change discipline, DoD, RAG retriever).

## Commands

```bash
cd db && docker compose up -d && ./scripts/migrate.ps1
cd ai && uv sync --all-extras && uv run pytest && uv run uvicorn app.main:app --reload --port 8000
cd web && npm run dev
```
