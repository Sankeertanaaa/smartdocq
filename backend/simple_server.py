#!/usr/bin/env python3
"""
Simple server without MongoDB dependency for testing
"""
import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import PyPDF2
from docx import Document

# Set environment variables
os.environ.setdefault('GOOGLE_API_KEY', 'test-key')
os.environ.setdefault('SECRET_KEY', 'test-secret')

app = FastAPI(title="SmartDoc Simple API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SmartDoc Simple API is running!", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SmartDoc Simple API"}

@app.post("/api/auth/login")
async def simple_login(credentials: dict):
    """Simple login that always succeeds for testing"""
    return {
        "access_token": "test-token-123",
        "token_type": "bearer",
        "user": {
            "id": "test-user-id",
            "fullName": "Test User",
            "email": credentials.get("email", "test@example.com"),
            "role": "admin"
        }
    }

@app.get("/api/auth/verify")
async def simple_verify():
    """Simple token verification"""
    return {
        "id": "test-user-id",
        "fullName": "Test User", 
        "email": "test@example.com",
        "role": "admin",
        "is_active": True
    }

@app.post("/api/upload")
async def simple_upload(file: UploadFile = File(...)):
    """Simple upload endpoint for testing"""
    try:
        print(f"\n📄 === UPLOAD REQUEST ===", flush=True)
        print(f"File object type: {type(file)}", flush=True)
        print(f"Filename: {file.filename}")
        print(f"Content-Type: {file.content_type}")
        
        # Validate file
        if not file or not file.filename:
            print("❌ Error: No file or filename")
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        try:
            content = await file.read()
            file_size = len(content)
            print(f"File size: {file_size} bytes")
        except Exception as read_error:
            print(f"❌ Error reading file: {read_error}")
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(read_error)}")
        
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = ['.pdf', '.docx', '.txt']
        
        print(f"Extension: '{file_extension}'")
        print(f"Extension repr: {repr(file_extension)}")
        print(f"Extension bytes: {file_extension.encode('utf-8')}")
        print(f"Allowed: {allowed_extensions}")
        print(f"Extension == '.docx': {file_extension == '.docx'}")
        print(f"Extension in allowed: {file_extension in allowed_extensions}")
        
        if not file_extension:
            error_msg = "File has no extension"
            print(f"❌ Validation error: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        if file_extension not in allowed_extensions:
            error_msg = f"Invalid file format '{file_extension}'. Allowed: {', '.join(allowed_extensions)}"
            print(f"❌ Validation error: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        print(f"✅ Upload successful: {document_id}")
        print(f"=== END UPLOAD REQUEST ===\n")
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "file_size": file_size,
            "status": "processed",
            "message": "Document uploaded and processed successfully"
        }
        
    except HTTPException as he:
        print(f"❌ HTTP Exception: {he.status_code} - {he.detail}")
        print(f"=== END UPLOAD REQUEST ===\n")
        raise
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"=== END UPLOAD REQUEST ===\n")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/documents")
async def simple_documents():
    """Simple documents list"""
    return {
        "total_chunks": 0,
        "collection_name": "test_collection",
        "documents": []
    }

@app.get("/api/history/sessions")
async def simple_sessions():
    """Simple sessions list"""
    return {
        "sessions": [],
        "total": 0
    }

@app.get("/api/history")
async def simple_history():
    """Simple history list"""
    return {
        "messages": [],
        "total": 0
    }

@app.post("/api/chat")
async def simple_chat(request: dict):
    """Simple chat endpoint"""
    return {
        "answer": "This is a test response from the simple server. The full chat functionality requires the main server with MongoDB.",
        "session_id": request.get("session_id", "test-session"),
        "sources": []
    }

@app.get("/api/feedback")
async def simple_feedback():
    """Simple feedback stats"""
    return {
        "total_feedback": 0,
        "average_rating": 0,
        "feedback_items": []
    }

@app.get("/api/auth/users")
async def simple_users():
    """Simple users list for admin"""
    return [
        {
            "id": "test-user-id",
            "fullName": "Test User",
            "email": "test@example.com",
            "role": "admin",
            "is_active": True
        }
    ]

if __name__ == "__main__":
    print("🚀 Starting Simple SmartDoc Server...")
    print("🌟 Server will start on http://localhost:8000")
    
    uvicorn.run(
        "simple_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
