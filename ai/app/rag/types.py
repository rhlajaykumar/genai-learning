"""RAG types and Retriever protocol (Neo4j-swappable)."""

from dataclasses import dataclass, field
from typing import Any, Protocol
from uuid import UUID


@dataclass
class Passage:
    """Stable retrieval result shape across backends."""

    text: str
    score: float
    source_doc_id: UUID
    metadata: dict[str, Any] = field(default_factory=dict)
    chunk_id: UUID | None = None


class Retriever(Protocol):
    """Backend-agnostic ingest/retrieve/delete for RAG."""

    async def ingest(
        self,
        agent_id: UUID,
        document_id: UUID,
        chunks: list[tuple[str, list[float], dict[str, Any]]],
    ) -> None:
        """Store chunk text + embeddings for a document."""

    async def retrieve(
        self,
        agent_id: UUID,
        query_embedding: list[float],
        k: int = 5,
    ) -> list[Passage]:
        """Return top-k passages for an agent."""

    async def delete_document(self, agent_id: UUID, document_id: UUID) -> None:
        """Remove all chunks for a document."""
