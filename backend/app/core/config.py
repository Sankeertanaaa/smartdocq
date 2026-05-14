import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load .env from backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


class Settings(BaseSettings):
    # API
    api_v1_str: str = "/api"
    project_name: str = "SmartDocQ"

    # Google Gemini API
    GOOGLE_API_KEY: Optional[str] = Field(
        default=None,
        env="GOOGLE_API_KEY"
    )

    # MongoDB
    MONGODB_URL: str = Field(
        default="mongodb://localhost:27017",
        env="MONGODB_URL"
    )

    MONGODB_DATABASE: str = Field(
        default="smartdocq",
        env="MONGODB_DATABASE"
    )

    # ChromaDB
    CHROMA_PERSIST_DIRECTORY: str = Field(
        default="./chroma_db",
        env="CHROMA_PERSIST_DIRECTORY"
    )

    # Uploads
    MAX_FILE_SIZE: int = Field(
        default=20 * 1024 * 1024,
        env="MAX_FILE_SIZE"
    )

    allowed_file_types: List[str] = [
        ".pdf",
        ".docx",
        ".txt"
    ]

    UPLOAD_FOLDER: str = Field(
        default="./uploads",
        env="UPLOAD_FOLDER"
    )

    # Security
    SECRET_KEY: str = Field(
        default="change_this_secret_key",
        env="SECRET_KEY"
    )

    ALGORITHM: str = Field(
        default="HS256",
        env="ALGORITHM"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,
        env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()

# Create required directories
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)