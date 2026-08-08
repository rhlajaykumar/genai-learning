"""Unit tests that do not require Postgres or live LLM."""

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.rag.chunking import chunk_fixed, chunk_paragraphs, chunk_sentences, split_text
from app.rag.ingest import chunk_text, checksum_bytes
from app.rag.factory import get_retriever
from app.core.config import settings
from uuid import uuid4


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("secret12")
    assert verify_password("secret12", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_roundtrip() -> None:
    user_id = uuid4()
    token = create_access_token(user_id, "alice")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["username"] == "alice"


def test_chunk_text() -> None:
    text = "word " * 50
    chunks = chunk_text(text, chunk_size=40, overlap=5)
    assert len(chunks) >= 2
    assert all(chunks)


def test_chunk_strategies() -> None:
    text = "First sentence. Second sentence! Third sentence?\n\nParagraph two starts here."
    fixed = split_text(text, strategy="fixed", chunk_size=40, overlap=5)
    sentences = split_text(text, strategy="sentence", chunk_size=80, overlap=10)
    paragraphs = split_text(text, strategy="paragraph", chunk_size=80, overlap=10)
    assert fixed
    assert sentences
    assert paragraphs
    assert chunk_sentences(text, 80, 10)
    assert chunk_paragraphs(text, 80, 10)
    assert chunk_fixed(text, 40, 5)


def test_checksum_stable() -> None:
    assert checksum_bytes(b"abc") == checksum_bytes(b"abc")


def test_retriever_factory_pgvector() -> None:
    class DummySession:
        pass

    settings.retriever_backend = "pgvector"
    r = get_retriever(DummySession())  # type: ignore[arg-type]
    assert r.__class__.__name__ == "PgvectorRetriever"


def test_retriever_factory_neo4j_not_implemented() -> None:
    class DummySession:
        pass

    settings.retriever_backend = "neo4j"
    try:
        import pytest

        with pytest.raises(NotImplementedError):
            get_retriever(DummySession())  # type: ignore[arg-type]
    finally:
        settings.retriever_backend = "pgvector"
