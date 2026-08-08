"""Pydantic request/response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    username: str


class UserOut(BaseModel):
    id: UUID
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    system_instruction: str = Field(default="", max_length=20_000)


class AgentOut(BaseModel):
    id: UUID
    name: str
    system_instruction: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: UUID
    agent_id: UUID
    filename: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    agent_id: UUID


class SessionOut(BaseModel):
    id: UUID
    agent_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20_000)


class ChatMessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut
    trace_id: UUID | None = None


class TraceOut(BaseModel):
    id: UUID
    session_id: UUID
    message_id: UUID | None
    latency_ms: int | None
    retrieved_chunk_ids: list[UUID]
    model: str | None
    error: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class EvalOut(BaseModel):
    id: UUID | None = None
    agent_id: UUID
    name: str
    status: str = "coming_soon"
    detail: str = "Evals are not implemented yet."


class HealthResponse(BaseModel):
    status: str
    service: str
