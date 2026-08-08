"""Chat, traces, and evals routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_session
from app.models import Agent, ChatSession, Eval, InteractionTrace, User
from app.schemas import (
    ChatRequest,
    ChatResponse,
    EvalOut,
    SessionCreate,
    SessionOut,
    TraceOut,
)
from app.services.chat import run_chat_turn

router = APIRouter(tags=["chat"])


async def _owned_agent(
    session: AsyncSession,
    agent_id: UUID,
    user: User,
) -> Agent:
    result = await session.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_user_id == user.id)
    )
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/sessions", response_model=SessionOut)
async def create_session(
    body: SessionCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatSession:
    """Start a chat session with an owned agent."""
    await _owned_agent(session, body.agent_id, user)
    chat_session = ChatSession(agent_id=body.agent_id, user_id=user.id)
    session.add(chat_session)
    await session.commit()
    await session.refresh(chat_session)
    return chat_session


@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
async def chat(
    session_id: UUID,
    body: ChatRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatResponse:
    """Send a message in a chat session and get an assistant reply."""
    result = await session.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
        )
    )
    chat_session = result.scalar_one_or_none()
    if chat_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    agent = await _owned_agent(session, chat_session.agent_id, user)
    user_msg, assistant_msg, trace = await run_chat_turn(
        session,
        chat_session=chat_session,
        agent=agent,
        user_text=body.message,
    )
    await session.commit()
    return ChatResponse(
        user_message=user_msg,
        assistant_message=assistant_msg,
        trace_id=trace.id,
    )


@router.get("/agents/{agent_id}/traces", response_model=list[TraceOut])
async def list_traces(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[InteractionTrace]:
    """List interaction traces for an agent's sessions owned by the user."""
    await _owned_agent(session, agent_id, user)
    result = await session.execute(
        select(InteractionTrace)
        .join(ChatSession, ChatSession.id == InteractionTrace.session_id)
        .where(
            ChatSession.agent_id == agent_id,
            ChatSession.user_id == user.id,
        )
        .order_by(InteractionTrace.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())


@router.get("/agents/{agent_id}/evals", response_model=list[EvalOut])
async def list_evals(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[EvalOut]:
    """Placeholder evals endpoint."""
    await _owned_agent(session, agent_id, user)
    result = await session.execute(select(Eval).where(Eval.agent_id == agent_id))
    rows = list(result.scalars().all())
    if not rows:
        return [
            EvalOut(
                agent_id=agent_id,
                name="Default eval suite",
                status="coming_soon",
            )
        ]
    return [
        EvalOut(
            id=row.id,
            agent_id=row.agent_id,
            name=row.name,
            status=row.status,
        )
        for row in rows
    ]


@router.post("/agents/{agent_id}/evals", response_model=EvalOut, status_code=status.HTTP_201_CREATED)
async def create_eval_placeholder(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> EvalOut:
    """Create a placeholder eval record."""
    await _owned_agent(session, agent_id, user)
    row = Eval(agent_id=agent_id, name="Placeholder eval", status="coming_soon")
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return EvalOut(
        id=row.id,
        agent_id=row.agent_id,
        name=row.name,
        status=row.status,
    )
