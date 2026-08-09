"""Document parsing, chunking, and embedding for ingest."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.llm.provider import embed_texts
from app.models import Document
from app.rag.chunking import ChunkStrategy, chunk_fixed, split_text
from app.rag.factory import get_retriever


def checksum_bytes(data: bytes) -> str:
    """SHA-256 hex digest of file bytes."""
    return hashlib.sha256(data).hexdigest()


def read_document_text(path: Path, content_type: str | None = None) -> str:
    """Extract plain text from an uploaded file (txt/md/csv/json/pdf)."""
    suffix = path.suffix.lower()
    if suffix == ".pdf" or content_type == "application/pdf":
        return _read_pdf_text(path)
    if suffix in {".txt", ".md", ".markdown", ".csv", ".json"} or (
        content_type and content_type.startswith("text/")
    ):
        return path.read_text(encoding="utf-8", errors="replace")
    return path.read_text(encoding="utf-8", errors="replace")


def _read_pdf_text(path: Path) -> str:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError

    try:
        reader = PdfReader(str(path))
    except PdfReadError as exc:
        raise ValueError(f"Could not read PDF: {exc}") from exc

    parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            parts.append(text)
    return "\n\n".join(parts).strip()


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[str]:
    """Split text into overlapping character windows (fixed strategy)."""
    return chunk_fixed(
        text,
        chunk_size or settings.chunk_size,
        overlap if overlap is not None else settings.chunk_overlap,
    )


async def ingest_document(
    session: AsyncSession,
    document: Document,
    *,
    strategy: ChunkStrategy = "fixed",
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> None:
    """Read stored original, chunk, embed, and write via Retriever."""
    path = Path(document.storage_path)
    text = read_document_text(path, document.content_type)
    pieces = split_text(text, strategy=strategy, chunk_size=chunk_size, overlap=overlap)
    if not pieces:
        document.status = "empty"
        await session.flush()
        return

    embeddings = await embed_texts(pieces)
    chunk_meta = {
        "filename": document.filename,
        "strategy": strategy,
        "chunk_size": chunk_size,
        "chunk_overlap": overlap,
    }
    payload: list[tuple[str, list[float], dict[str, Any]]] = [
        (piece, emb, {**chunk_meta, "chunk_index": i})
        for i, (piece, emb) in enumerate(zip(pieces, embeddings, strict=True))
    ]
    retriever = get_retriever(session)
    await retriever.ingest(document.agent_id, document.id, payload)
    document.status = "ready"
    await session.flush()


async def retrieve_for_query(
    session: AsyncSession,
    agent_id: UUID,
    query: str,
    k: int | None = None,
) -> list:
    """Embed query and retrieve passages via configured Retriever."""
    from app.rag.types import Passage

    vectors = await embed_texts([query])
    retriever = get_retriever(session)
    passages: list[Passage] = await retriever.retrieve(
        agent_id, vectors[0], k=k or settings.retrieve_top_k
    )
    return passages
