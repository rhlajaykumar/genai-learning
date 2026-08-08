"""HTTP routes for the AI playground service."""

from fastapi import APIRouter

from app.api import agents, auth, chat
from app.schemas import HealthResponse

router = APIRouter()
router.include_router(auth.router)
router.include_router(agents.router)
router.include_router(chat.router)


@router.get("/")
async def root() -> dict[str, str]:
    """Service index for browsers hitting the API root."""
    return {
        "service": "ai-playground",
        "health": "/health",
        "docs": "/docs",
        "web_ui": "http://localhost:3000",
    }


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness check."""
    return HealthResponse(status="ok", service="ai")
