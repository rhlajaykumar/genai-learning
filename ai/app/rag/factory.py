"""Retriever factory — swap backends via RETRIEVER_BACKEND."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.rag.pgvector import PgvectorRetriever
from app.rag.types import Retriever


def get_retriever(session: AsyncSession) -> Retriever:
    """Return the configured Retriever implementation.

    v1: pgvector. Future: neo4j / hybrid without changing callers.
    """
    backend = settings.retriever_backend.lower().strip()
    if backend == "pgvector":
        return PgvectorRetriever(session)
    if backend == "neo4j":
        raise NotImplementedError(
            "Neo4j retriever is not implemented yet. "
            "Keep RETRIEVER_BACKEND=pgvector, or add app/rag/neo4j.py and wire it here."
        )
    raise ValueError(f"Unknown RETRIEVER_BACKEND: {backend}")
