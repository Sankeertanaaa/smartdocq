#!/usr/bin/env python3
"""
Simple server startup script with better error handling
"""
import os
import sys
import uvicorn
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_modules = [
        'fastapi',
        'uvicorn', 
        'PyPDF2',
        'docx',
        'pydantic',
        'motor',
        'pymongo',
        'google.generativeai',
        'chromadb'
    ]
    
    missing = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("Please run: python install_deps.py")
        return False
    
    print("✅ All required dependencies are installed")
    return True

def setup_environment():
    """Setup environment variables"""
    # Set default environment variables if not present
    env_vars = {
        'GOOGLE_API_KEY': 'your_google_api_key_here',
        'MONGODB_URL': 'mongodb://localhost:27017',
        'MONGODB_DATABASE': 'smartdocq',
        'SECRET_KEY': 'your-secret-key-here-change-in-production',
        'ALGORITHM': 'HS256',
        'ACCESS_TOKEN_EXPIRE_MINUTES': '30',
        'UPLOAD_FOLDER': './uploads',
        'CHROMA_PERSIST_DIRECTORY': './chroma_db'
    }
    
    for key, default_value in env_vars.items():
        if key not in os.environ:
            os.environ[key] = default_value
    
    # Create necessary directories
    upload_dir = Path(os.environ.get('UPLOAD_FOLDER', './uploads'))
    chroma_dir = Path(os.environ.get('CHROMA_PERSIST_DIRECTORY', './chroma_db'))
    
    upload_dir.mkdir(exist_ok=True)
    chroma_dir.mkdir(exist_ok=True)
    
    print(f"📁 Upload directory: {upload_dir.absolute()}")
    print(f"📁 ChromaDB directory: {chroma_dir.absolute()}")

def main():
    """Start the FastAPI server"""
    print("🚀 Starting SmartDoc Backend Server...")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Start server
    try:
        print("🌟 Server starting on http://localhost:8000")
        print("📚 API documentation available at http://localhost:8000/docs")
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
