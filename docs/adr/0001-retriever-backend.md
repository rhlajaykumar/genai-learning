# ADR 0001 — Swappable RAG Retriever

## Status

Accepted

## Context

The AI playground needs RAG now (pgvector) and may need graph RAG (e.g. Neo4j) later without rewriting auth, agents, chat UI, or traces.

## Decision

- Keep app data (users, agents, documents metadata, chat, traces) in Postgres.
- Store **original uploaded files** on disk (`UPLOAD_DIR`) with paths in `playground.documents`.
- Route all vector/graph access through `Retriever` (`ingest` / `retrieve` / `delete_document`) and stable `Passage` objects.
- Select backend with `RETRIEVER_BACKEND` (`pgvector` today; `neo4j` later).

## Consequences

- Switching to Neo4j means: add `Neo4jGraphRetriever`, re-ingest from stored originals, flip the env var.
- Do not call pgvector SQL from routes or agent tools directly.
