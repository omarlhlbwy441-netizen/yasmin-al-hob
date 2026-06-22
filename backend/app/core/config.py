"""
⚙️ Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "Yasmin AI Builder"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://yasmin:yasmin@localhost:5432/yasmin"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Elasticsearch
    ELASTICSEARCH_HOSTS: str = "http://localhost:9200"

    # Security
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400  # 24 hours
    ENCRYPTION_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://yasmin.ai"]

    # Email
    SENDGRID_API_KEY: str = ""
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "noreply@yasmin.ai"

    # Push Notifications
    FCM_PROJECT_ID: str = ""
    FCM_SERVICE_ACCOUNT_JSON: str = ""
    ONESIGNAL_APP_ID: str = ""
    ONESIGNAL_API_KEY: str = ""

    # AI APIs
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
