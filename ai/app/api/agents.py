"""Agent and document routes."""

from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_session
from app.models import Agent, Document, User
from app.rag.ingest import checksum_bytes, ingest_document
from app.schemas import AgentCreate, AgentOut, DocumentOut

router = APIRouter(prefix="/agents", tags=["agents"])


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


@router.post("", response_model=AgentOut)
async def create_agent(
    body: AgentCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> Agent:
    """Create a RAG agent with a system instruction."""
    agent = Agent(
        owner_user_id=user.id,
        name=body.name,
        system_instruction=body.system_instruction,
    )
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.get("", response_model=list[AgentOut])
async def list_agents(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[Agent]:
    """List agents owned by the current user."""
    result = await session.execute(
        select(Agent)
        .where(Agent.owner_user_id == user.id)
        .order_by(Agent.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> Agent:
    """Get one owned agent."""
    return await _owned_agent(session, agent_id, user)


@router.post("/{agent_id}/documents", response_model=DocumentOut)
async def upload_document(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File()],
) -> Document:
    """Upload a document, store the original, and ingest into the Retriever."""
    agent = await _owned_agent(session, agent_id, user)
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    upload_root = Path(settings.upload_dir) / str(agent.id)
    upload_root.mkdir(parents=True, exist_ok=True)
    doc_id = uuid4()
    safe_name = Path(file.filename or "upload.txt").name
    storage_path = upload_root / f"{doc_id}_{safe_name}"
    storage_path.write_bytes(data)

    document = Document(
        id=doc_id,
        agent_id=agent.id,
        filename=safe_name,
        storage_path=str(storage_path),
        content_type=file.content_type,
        checksum=checksum_bytes(data),
        status="processing",
    )
    session.add(document)
    await session.flush()

    try:
        await ingest_document(session, document)
    except Exception as exc:  # noqa: BLE001
        document.status = "failed"
        await session.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Ingest failed: {exc}",
        ) from exc

    await session.commit()
    await session.refresh(document)
    return document


@router.get("/{agent_id}/documents", response_model=list[DocumentOut])
async def list_documents(
    agent_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[Document]:
    """List documents for an owned agent."""
    await _owned_agent(session, agent_id, user)
    result = await session.execute(
        select(Document)
        .where(Document.agent_id == agent_id)
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())
