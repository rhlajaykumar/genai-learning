"""LLM provider helpers (Ollama default; Google optional)."""

from __future__ import annotations

import hashlib

from app.core.config import settings


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed texts using the configured LLM provider."""
    if not texts:
        return []
    provider = settings.llm_provider.lower().strip()
    if provider == "ollama":
        from app.llm.ollama import ollama_embed

        return await ollama_embed(texts)
    if provider == "google":
        return await _google_embed(texts)
    if provider == "fake":
        return [_fake_embedding(t) for t in texts]
    raise ValueError(f"Unknown LLM_PROVIDER: {provider}")


async def generate_reply(
    *,
    system_instruction: str,
    context: str,
    user_message: str,
) -> str:
    """Generate an assistant reply with retrieved context."""
    system = (
        f"{system_instruction.strip()}\n\n"
        "Use the following retrieved context when relevant. "
        "If the context is insufficient, say so briefly.\n\n"
        f"Context:\n{context}"
    )
    provider = settings.llm_provider.lower().strip()
    if provider == "ollama":
        from app.llm.ollama import ollama_chat

        return await ollama_chat(system=system, user=user_message)
    if provider == "google":
        return await _google_generate(system, user_message)
    if provider == "fake":
        return (
            "(fake provider) Based on retrieved context:\n"
            f"{context[:1500]}\n\nYou asked: {user_message}"
        )
    raise ValueError(f"Unknown LLM_PROVIDER: {provider}")


async def _google_embed(texts: list[str]) -> list[list[float]]:
    if not settings.google_api_key:
        return [_fake_embedding(t) for t in texts]
    from google import genai

    client = genai.Client(api_key=settings.google_api_key)
    vectors: list[list[float]] = []
    for text in texts:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=text,
        )
        vectors.append(list(result.embeddings[0].values))
    return vectors


async def _google_generate(system: str, user_message: str) -> str:
    if not settings.google_api_key:
        return (
            "(dev mode — no GOOGLE_API_KEY) "
            f"System context length={len(system)}; you asked: {user_message}"
        )
    from google import genai

    client = genai.Client(api_key=settings.google_api_key)
    result = client.models.generate_content(
        model=settings.text_model,
        contents=f"{system}\n\nUser: {user_message}",
    )
    text = getattr(result, "text", None)
    return text if text else str(result)


def _fake_embedding(text: str) -> list[float]:
    dim = settings.embedding_dim
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    values = [((seed[i % len(seed)] + i) % 256) / 255.0 for i in range(dim)]
    norm = sum(v * v for v in values) ** 0.5 or 1.0
    return [v / norm for v in values]
