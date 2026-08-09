"""Chat orchestration with retrieval + configured LLM provider."""

from __future__ import annotations

import html
import time
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.llm.provider import generate_reply
from app.models import Agent, ChatMessage, ChatSession, InteractionTrace
from app.rag.ingest import retrieve_for_query


def _format_context(passages: list) -> str:
    if not passages:
        return "No retrieved context."
    parts = []
    for i, p in enumerate(passages, start=1):
        parts.append(f"[{i}] (score={p.score:.3f}) {p.text}")
    return "\n\n".join(parts)


def _normalize_html_reply(text: str) -> str:
    """Strip common Markdown fences so replies can be rendered as HTML."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    if "<" not in cleaned:
        return f"<p>{html.escape(cleaned)}</p>"
    return cleaned


async def run_chat_turn(
    session: AsyncSession,
    *,
    chat_session: ChatSession,
    agent: Agent,
    user_text: str,
) -> tuple[ChatMessage, ChatMessage, InteractionTrace]:
    """Persist user/assistant messages, retrieve context, generate reply, write trace."""
    user_msg = ChatMessage(
        session_id=chat_session.id,
        role="user",
        content=user_text,
    )
    session.add(user_msg)
    await session.flush()

    started = time.perf_counter()
    error: str | None = None
    chunk_ids: list[UUID] = []
    passages: list = []
    reply_text = ""

    try:
        passages = await retrieve_for_query(session, agent.id, user_text)
        chunk_ids = [p.chunk_id for p in passages if p.chunk_id]
        context = _format_context(passages)
        reply_text = await generate_reply(
            system_instruction=agent.system_instruction,
            context=context,
            user_message=user_text,
        )
        reply_text = _normalize_html_reply(reply_text)
    except Exception as exc:  # noqa: BLE001 — capture into trace
        error = str(exc)
        reply_text = (
            "<p>Sorry, I could not complete that request.</p>"
            f"<p><strong>Error:</strong> {html.escape(error)}</p>"
        )

    latency_ms = int((time.perf_counter() - started) * 1000)

    assistant_msg = ChatMessage(
        session_id=chat_session.id,
        role="assistant",
        content=reply_text,
    )
    session.add(assistant_msg)
    await session.flush()

    trace = InteractionTrace(
        session_id=chat_session.id,
        message_id=assistant_msg.id,
        latency_ms=latency_ms,
        retrieved_chunk_ids=chunk_ids,
        model=settings.text_model,
        error=error,
        raw={
            "user_message_id": str(user_msg.id),
            "user_message": user_text,
            "assistant_message": reply_text,
            "passage_count": len(chunk_ids),
            "llm_provider": settings.llm_provider,
            "retrieved_passages": [
                {
                    "chunk_id": str(p.chunk_id) if p.chunk_id else None,
                    "score": p.score,
                    "text": p.text,
                    "source_doc_id": str(p.source_doc_id),
                }
                for p in passages
            ],
        },
    )
    session.add(trace)
    await session.flush()
    return user_msg, assistant_msg, trace
