"""Text splitting strategies for RAG ingest."""

from __future__ import annotations

import re
from typing import Literal

from app.core.config import settings

ChunkStrategy = Literal["fixed", "sentence", "paragraph"]


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_fixed(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Split text into overlapping character windows."""
    cleaned = _normalize_whitespace(text)
    if not cleaned:
        return []
    if len(cleaned) <= chunk_size:
        return [cleaned]
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = start + chunk_size
        chunks.append(cleaned[start:end])
        if end >= len(cleaned):
            break
        start = max(0, end - overlap)
    return chunks


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [part.strip() for part in parts if part.strip()]


def _split_paragraphs(text: str) -> list[str]:
    parts = re.split(r"\n\s*\n+", text.strip())
    return [re.sub(r"\s+", " ", part).strip() for part in parts if part.strip()]


def _merge_units(units: list[str], chunk_size: int, overlap: int) -> list[str]:
    """Merge text units (sentences/paragraphs) into size-bounded chunks."""
    if not units:
        return []
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current, current_len
        if not current:
            return
        chunk = " ".join(current)
        chunks.append(chunk)
        if overlap > 0 and len(chunk) > overlap:
            tail = chunk[-overlap:]
            current = [tail]
            current_len = len(tail)
        else:
            current = []
            current_len = 0

    for unit in units:
        unit_len = len(unit)
        if unit_len > chunk_size:
            flush()
            chunks.extend(chunk_fixed(unit, chunk_size, overlap))
            current = []
            current_len = 0
            continue
        extra = unit_len + (1 if current else 0)
        if current and current_len + extra > chunk_size:
            flush()
        current.append(unit)
        current_len += extra
    flush()
    return chunks


def chunk_sentences(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Group sentences into chunks up to chunk_size characters."""
    cleaned = _normalize_whitespace(text)
    return _merge_units(_split_sentences(cleaned), chunk_size, overlap)


def chunk_paragraphs(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Group paragraphs into chunks up to chunk_size characters."""
    return _merge_units(_split_paragraphs(text), chunk_size, overlap)


def split_text(
    text: str,
    strategy: ChunkStrategy = "fixed",
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[str]:
    """Split document text using the selected chunking strategy."""
    size = chunk_size or settings.chunk_size
    ov = overlap if overlap is not None else settings.chunk_overlap
    if strategy == "sentence":
        return chunk_sentences(text, size, ov)
    if strategy == "paragraph":
        return chunk_paragraphs(text, size, ov)
    return chunk_fixed(text, size, ov)
