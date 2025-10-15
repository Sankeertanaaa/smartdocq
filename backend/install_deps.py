#!/usr/bin/env python3
"""
Install dependencies one by one to avoid conflicts
"""
import subprocess
import sys

dependencies = [
    "fastapi==0.104.1",
    "uvicorn[standard]==0.24.0", 
    "python-multipart==0.0.6",
    "python-dotenv==1.0.0",
    "PyPDF2==3.0.1",
    "python-docx==1.1.0",
    "pydantic==2.5.0",
    "pydantic-settings==2.1.0",
    "PyJWT==2.8.0",
    "bcrypt==4.1.2",
    "motor==3.3.2",
    "pymongo==4.6.0",
    "google-generativeai==0.3.2",
    "chromadb==0.4.18",
    "langchain==0.0.350",
    "langchain-google-genai==0.0.5",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "aiofiles==23.2.1",
    "httpx==0.25.2",
    "numpy==1.24.3",
    "sentence-transformers==2.2.2"
]

def install_package(package):
    """Install a single package"""
    try:
        print(f"Installing {package}...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                              capture_output=True, text=True, check=True)
        print(f"✓ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install {package}: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    """Install all dependencies"""
    print("Installing SmartDoc backend dependencies...")
    
    failed_packages = []
    
    for package in dependencies:
        if not install_package(package):
            failed_packages.append(package)
    
    if failed_packages:
        print(f"\n❌ Failed to install {len(failed_packages)} packages:")
        for package in failed_packages:
            print(f"  - {package}")
    else:
        print("\n✅ All dependencies installed successfully!")

if __name__ == "__main__":
    main()
