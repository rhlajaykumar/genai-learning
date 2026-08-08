"""Postgres pgvector Retriever implementation."""

from typing import Any
from uuid import UUID

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Chunk
from app.rag.types import Passage


class PgvectorRetriever:
    """Store and query embeddings in playground.chunks."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ingest(
        self,
        agent_id: UUID,
        document_id: UUID,
        chunks: list[tuple[str, list[float], dict[str, Any]]],
    ) -> None:
        """Insert chunk rows for a document (replaces prior chunks for that doc)."""
        await self.delete_document(agent_id, document_id)
        for index, (content, embedding, metadata) in enumerate(chunks):
            self._session.add(
                Chunk(
                    document_id=document_id,
                    agent_id=agent_id,
                    content=content,
                    embedding=embedding,
                    metadata_=metadata,
                    chunk_index=index,
                )
            )
        await self._session.flush()

    async def retrieve(
        self,
        agent_id: UUID,
        query_embedding: list[float],
        k: int = 5,
    ) -> list[Passage]:
        """Cosine-distance nearest neighbors for the agent."""
        # pgvector cosine distance operator <=>
        stmt = (
            select(
                Chunk,
                Chunk.embedding.cosine_distance(query_embedding).label("distance"),
            )
            .where(Chunk.agent_id == agent_id)
            .order_by(text("distance"))
            .limit(k)
        )
        result = await self._session.execute(stmt)
        passages: list[Passage] = []
        for chunk, distance in result.all():
            score = 1.0 - float(distance) if distance is not None else 0.0
            passages.append(
                Passage(
                    text=chunk.content,
                    score=score,
                    source_doc_id=chunk.document_id,
                    metadata=dict(chunk.metadata_ or {}),
                    chunk_id=chunk.id,
                )
            )
        return passages

    async def delete_document(self, agent_id: UUID, document_id: UUID) -> None:
        """Delete chunks belonging to a document."""
        await self._session.execute(
            delete(Chunk).where(
                Chunk.agent_id == agent_id,
                Chunk.document_id == document_id,
            )
        )
        await self._session.flush()
