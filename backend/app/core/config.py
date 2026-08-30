import os
from pathlib import Path
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(_env_path)

class Settings(BaseSettings):
    # API Config
    API_ENV: str = os.getenv("API_ENV", "development")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 5000))
    API_URL: str = os.getenv("API_URL", "http://localhost:5000")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    # DB Config (SQLite default, MySQL via DATABASE_URL env override)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./financial_time_machine.db")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Auth — SECRET_KEY must be a long, random string in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # Login rate-limiting (in-memory sliding window)
    RATE_LIMIT_LOGIN_MAX: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", 10))
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_SECONDS", 300))

    # Local AI
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "llama3")

    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Financial Time Machine")

settings = Settings()
