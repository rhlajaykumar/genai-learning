"""Map interaction traces to API responses."""

from __future__ import annotations

from uuid import UUID

from app.models import InteractionTrace
from app.schemas import RetrievedPassageOut, TraceOut


def trace_to_out(trace: InteractionTrace) -> TraceOut:
    """Build TraceOut including execution details stored in trace.raw."""
    raw = trace.raw or {}
    passages_raw = raw.get("retrieved_passages") or []
    passages: list[RetrievedPassageOut] = []
    for item in passages_raw:
        if not isinstance(item, dict):
            continue
        chunk_id = item.get("chunk_id")
        passages.append(
            RetrievedPassageOut(
                chunk_id=UUID(chunk_id) if chunk_id else None,
                score=float(item.get("score", 0)),
                text=str(item.get("text", "")),
                source_doc_id=(
                    UUID(item["source_doc_id"])
                    if item.get("source_doc_id")
                    else None
                ),
            )
        )
    return TraceOut(
        id=trace.id,
        session_id=trace.session_id,
        message_id=trace.message_id,
        latency_ms=trace.latency_ms,
        retrieved_chunk_ids=trace.retrieved_chunk_ids or [],
        model=trace.model,
        error=trace.error,
        created_at=trace.created_at,
        user_message=raw.get("user_message"),
        assistant_message=raw.get("assistant_message"),
        retrieved_passages=passages,
        llm_provider=raw.get("llm_provider"),
    )
