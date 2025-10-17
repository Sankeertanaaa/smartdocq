import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

# Explicitly load .env file with absolute path
import sys
from pathlib import Path

# Get the backend directory (where .env should be)
backend_dir = Path(__file__).parent.parent.parent
env_path = backend_dir / ".env"

print(f"🔍 Looking for .env at: {env_path}")
print(f"🔍 .env file exists: {env_path.exists()}")

if env_path.exists():
    # Force read and set SECRET_KEY from .env file
    print("🔧 Force loading SECRET_KEY from .env...")
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"📄 .env file content (first 200 chars): {content[:200]}")
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                if 'SECRET_KEY' in line and '=' in line:
                    print(f"🔍 Found SECRET_KEY line: '{line}'")
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        # Remove quotes
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        if key == 'SECRET_KEY':
                            os.environ['SECRET_KEY'] = value
                            print(f"✅ Force set SECRET_KEY: {value[:10]}... (length: {len(value)})")
                            break
    
    load_dotenv(env_path, override=True)
    
    # Debug: Check what's in the file vs what's loaded
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith("GOOGLE_API_KEY"):
                print(f"🔍 Found in .env file: {line.strip()[:40]}...")
            if line.startswith("SECRET_KEY"):
                print(f"🔍 SECRET_KEY in file: {line.strip()[:25]}...")
    
    # Verify environment variables are actually loaded
    secret_from_env = os.getenv('SECRET_KEY', 'NOT FOUND')
    print(f"🔍 SECRET_KEY from os.environ: {secret_from_env[:10] if secret_from_env != 'NOT FOUND' else 'NOT FOUND'}...")
    print(f"🔍 Full SECRET_KEY length: {len(secret_from_env) if secret_from_env != 'NOT FOUND' else 0}")
    
    # Manual fallback if load_dotenv fails for SECRET_KEY
    if False:  # Disabled since we manually set it above
        print("⚠️ Manually parsing .env for SECRET_KEY...")
        with open(env_path, encoding='utf-8') as f:
            lines = f.readlines()
            print(f"📄 Total lines in .env: {len(lines)}")
            for i, line in enumerate(lines):
                line = line.strip()
                print(f"   Line {i+1}: '{line}' (length: {len(line)})")
                # Check for SECRET_KEY with various formats
                if (line.startswith('SECRET_KEY=') or 
                    line.startswith('SECRET_KEY =') or 
                    'SECRET_KEY=' in line[:20]):
                    print(f"🔍 Found SECRET_KEY line: '{line}'")
                    # Split on first = sign
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        value = parts[1].strip()
                        print(f"🔍 Raw value: '{value}'")
                        # Remove quotes if present
                        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                            print(f"🔍 Removed quotes: '{value}'")
                        os.environ['SECRET_KEY'] = value
                        print(f"✅ Manually set SECRET_KEY: {value[:10]}...")
                        break
            else:
                print("❌ SECRET_KEY line not found in .env file!")
                print("🔍 Looking for lines containing 'SECRET'...")
                for i, line in enumerate(lines):
                    if 'SECRET' in line.upper():
                        print(f"   Found SECRET in line {i+1}: '{line}'")
else:
    print("⚠️ .env file not found!")
    load_dotenv()


class Settings(BaseSettings):
    # API Configuration
    api_v1_str: str = "/api"
    project_name: str = "SmartDocQ"
    
    # Google Gemini API (optional - used only as fallback if local embeddings fail)
    GOOGLE_API_KEY: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    
    # MongoDB Configuration
    MONGODB_URL: str = Field(default="mongodb://localhost:27017", env="MONGODB_URL")
    MONGODB_DATABASE: str = Field(default="smartdocq", env="MONGODB_DATABASE")
    
    # ChromaDB Configuration
    CHROMA_PERSIST_DIRECTORY: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(default=20 * 1024 * 1024, env="MAX_FILE_SIZE")
    allowed_file_types: List[str] = [".pdf", ".docx", ".txt"]
    UPLOAD_FOLDER: str = Field(default="./uploads", env="UPLOAD_FOLDER")
    
    # Security - Force override from environment
    SECRET_KEY: str = Field(default="S@nk33rTaN@", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
        env_file_encoding = 'utf-8'

settings = Settings()

# Debug: Print what was loaded
print(f"🔧 Config loaded - API Key: {'Set' if settings.GOOGLE_API_KEY else 'Not set (optional)'}")
print(f"🔧 MongoDB URL: {settings.MONGODB_URL}")
print(f"🔧 Secret Key starts with: {settings.SECRET_KEY[:10]}...")

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
