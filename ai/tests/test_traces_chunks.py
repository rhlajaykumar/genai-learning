"""Tests for pagination schemas and trace mapping."""

from datetime import UTC, datetime
from uuid import uuid4

from app.models import InteractionTrace
from app.schemas import PaginatedResponse
from app.services.traces import trace_to_out


def test_paginated_response_build() -> None:
    page = PaginatedResponse.build(["a", "b"], page=1, page_size=10, total=2)
    assert page.total == 2
    assert page.total_pages == 1
    assert len(page.items) == 2


def test_trace_to_out_maps_raw_fields() -> None:
    trace_id = uuid4()
    session_id = uuid4()
    chunk_id = uuid4()
    trace = InteractionTrace(
        id=trace_id,
        session_id=session_id,
        message_id=None,
        latency_ms=120,
        retrieved_chunk_ids=[chunk_id],
        model="qwen3:8b",
        error=None,
        raw={
            "user_message": "What is the refund policy?",
            "assistant_message": "30 days.",
            "llm_provider": "ollama",
            "retrieved_passages": [
                {
                    "chunk_id": str(chunk_id),
                    "score": 0.91,
                    "text": "Refund within 30 days.",
                    "source_doc_id": str(uuid4()),
                }
            ],
        },
        created_at=datetime.now(UTC),
    )
    out = trace_to_out(trace)
    assert out.user_message == "What is the refund policy?"
    assert out.assistant_message == "30 days."
    assert len(out.retrieved_passages) == 1
    assert out.retrieved_passages[0].score == 0.91
