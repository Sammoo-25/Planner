from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str
    database_url: str = "postgresql://postgres:postgres@localhost:5432/planer"
    redis_url: str = "redis://localhost:6379"
    express_api_url: str = "http://localhost:5005/api"
    jwt_secret: str = "supersecretkey123"
    agent_service_secret: str = "liferpg-internal-agent-secret-2024"
    agent_service_port: int = 8000

    # Model selection — cheap model for fast classification, powerful for reasoning
    model_fast: str = "claude-haiku-4-5-20251001"
    model_smart: str = "claude-sonnet-4-6"

    # Redis TTLs (seconds)
    conversation_ttl: int = 86400       # 24 hours
    insights_cache_ttl: int = 21600     # 6 hours
    daily_quests_cache_ttl: int = 3600  # 1 hour

    # Agent limits
    max_conversation_messages: int = 20
    agent_timeout_seconds: int = 30
    max_retries: int = 3


settings = Settings()
