"""Ollama HTTP client for chat and embeddings."""

from __future__ import annotations

import httpx

from app.core.config import settings


class OllamaError(RuntimeError):
    """Raised when an Ollama API call fails."""


async def ollama_embed(texts: list[str]) -> list[list[float]]:
    """Embed texts via Ollama `/api/embed` (batch)."""
    if not texts:
        return []
    url = f"{settings.ollama_base_url.rstrip('/')}/api/embed"
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            json={"model": settings.embedding_model, "input": texts},
        )
        if response.status_code >= 400:
            raise OllamaError(
                f"Ollama embed failed ({response.status_code}): {response.text}"
            )
        data = response.json()
    embeddings = data.get("embeddings") or []
    if len(embeddings) != len(texts):
        raise OllamaError(
            f"Expected {len(texts)} embeddings, got {len(embeddings)}"
        )
    return [_fit_dim(list(vec)) for vec in embeddings]


async def ollama_chat(
    *,
    system: str,
    user: str,
) -> str:
    """Chat completion via Ollama `/api/chat` (non-streaming)."""
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
    messages = []
    if system.strip():
        messages.append({"role": "system", "content": system.strip()})
    messages.append({"role": "user", "content": user})
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            url,
            json={
                "model": settings.text_model,
                "messages": messages,
                "stream": False,
            },
        )
        if response.status_code >= 400:
            raise OllamaError(
                f"Ollama chat failed ({response.status_code}): {response.text}"
            )
        data = response.json()
    message = data.get("message") or {}
    content = message.get("content")
    if not content:
        raise OllamaError(f"Empty Ollama chat response: {data}")
    return str(content)


def _fit_dim(vec: list[float]) -> list[float]:
    """Pad or truncate embedding to configured EMBEDDING_DIM."""
    dim = settings.embedding_dim
    if len(vec) == dim:
        return vec
    if len(vec) > dim:
        return vec[:dim]
    return vec + [0.0] * (dim - len(vec))
