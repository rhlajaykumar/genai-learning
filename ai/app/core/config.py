"""Application settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # llm_provider: ollama | google | fake
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://127.0.0.1:11434"
    google_api_key: str = ""
    text_model: str = "llama3.1:latest"
    embedding_model: str = "nomic-embed-text"
    embedding_dim: int = 768
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/booking"
    )
    jwt_secret: str = "dev-only-change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    retriever_backend: str = "pgvector"
    upload_dir: str = str(Path(__file__).resolve().parents[2] / "uploads")
    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieve_top_k: int = 5


settings = Settings()
