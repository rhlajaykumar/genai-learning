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
    # Chat model — avoid llama3.1 (large default ctx); qwen3:8b fits ~16GB VRAM with embed model
    text_model: str = "qwen3:8b"
    # Cap context to limit VRAM (llama3.1 defaults to 65536 ctx ≈ 17GB alone)
    ollama_num_ctx: int = 8192
    ollama_embed_num_ctx: int = 2048
    ollama_keep_alive: str = "10m"
    google_api_key: str = ""
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
