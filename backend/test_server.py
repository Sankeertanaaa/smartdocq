#!/usr/bin/env python3
"""
Test server for debugging upload issues
"""
import os
import sys
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="Test Upload Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test server running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/auth/login")
async def login(credentials: dict):
    return {
        "access_token": "test-token-123",
        "token_type": "bearer",
        "user": {
            "id": "test-user",
            "fullName": "Test User",
            "email": credentials.get("email", "test@test.com"),
            "role": "admin"
        }
    }

@app.get("/api/auth/verify")
async def verify():
    return {
        "id": "test-user",
        "fullName": "Test User",
        "email": "test@test.com",
        "role": "admin",
        "is_active": True
    }

@app.get("/api/auth/users")
async def users():
    """Get all users (admin only)"""
    return [
        {
            "id": "test-user-1",
            "fullName": "Admin User",
            "email": "admin@smartdoc.com",
            "role": "admin",
            "is_active": True
        },
        {
            "id": "test-user-2",
            "fullName": "Test Student",
            "email": "student@test.com",
            "role": "student",
            "is_active": True
        }
    ]

@app.post("/api/auth/register")
async def register(request: dict):
    """Register new user"""
    return {
        "message": "User registered successfully",
        "user": {
            "id": "new-user",
            "fullName": request.get("fullName", "New User"),
            "email": request.get("email", "user@test.com"),
            "role": request.get("role", "student")
        }
    }

@app.post("/api/auth/logout")
async def logout():
    """Logout user"""
    return {"message": "Successfully logged out"}

@app.get("/api/auth/me")
async def get_me():
    """Get current user info"""
    return {
        "id": "test-user",
        "fullName": "Test User",
        "email": "test@test.com",
        "role": "admin",
        "is_active": True
    }

@app.post("/api/auth/users/{user_id}/deactivate")
async def deactivate_user(user_id: str):
    """Deactivate a user"""
    return {"message": f"User {user_id} has been deactivated"}

@app.get("/api/history/sessions")
async def sessions():
    """Get chat sessions"""
    return {
        "sessions": [
            {
                "session_id": "test-session-1",
                "title": "Sample Chat Session",
                "created_at": "2025-01-15T10:00:00",
                "last_activity": "2025-01-15T10:30:00",
                "message_count": 0,
                "is_archived": False
            }
        ],
        "total": 1
    }

@app.get("/api/history")
async def history():
    """Get message history"""
    return {
        "messages": [],
        "total": 0
    }

@app.post("/api/history")
async def save_history(request: dict):
    """Save message to history"""
    return {"success": True, "message": "Message saved"}

@app.delete("/api/history/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    return {"message": f"Session {session_id} deleted"}

@app.post("/api/history/sessions")
async def create_session(request: dict):
    """Create new session"""
    return {
        "session_id": "test-session-new",
        "title": request.get("title", "New Session"),
        "created_at": "2025-01-15T11:00:00"
    }

@app.put("/api/history/sessions/{session_id}")
async def update_session(session_id: str, request: dict):
    """Update session"""
    return {"message": "Session updated", "session_id": session_id}

@app.post("/api/history/sessions/{session_id}/archive")
async def archive_session(session_id: str):
    """Archive session"""
    return {"message": "Session archived", "session_id": session_id}

@app.get("/api/history/stats")
async def history_stats():
    """Get history statistics"""
    return {
        "total_sessions": 1,
        "total_messages": 0,
        "active_sessions": 1
    }

@app.get("/api/feedback")
async def feedback():
    """Get feedback statistics"""
    return {
        "total_feedback": 0,
        "average_rating": 0,
        "feedback_items": [],
        "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    }

@app.post("/api/feedback")
async def submit_feedback(request: dict):
    """Submit feedback"""
    sys.stderr.write(f"\nFeedback submitted: Rating {request.get('rating', 'N/A')}\n")
    sys.stderr.flush()
    return {
        "success": True,
        "message": "Thank you for your feedback!"
    }

@app.get("/api/feedback/session/{session_id}")
async def session_feedback(session_id: str):
    """Get feedback for a session"""
    return {"feedback_items": [], "average_rating": 0}

@app.get("/api/feedback/analytics")
async def feedback_analytics():
    """Get feedback analytics"""
    return {
        "total_feedback": 0,
        "average_rating": 0,
        "trend": "stable"
    }

@app.get("/api/documents")
async def documents():
    """List uploaded documents"""
    return {
        "total_chunks": 1,
        "collection_name": "test",
        "documents": [
            {
                "document_id": "sample-doc-1",
                "filename": "SE_Final-Unit-1-Notes.pdf",
                "file_size": 9208973,
                "uploaded_at": "2025-01-15T11:00:00",
                "chunk_count": 1
            }
        ]
    }

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    sys.stderr.write(f"\nDocument deleted: {document_id}\n")
    sys.stderr.flush()
    return {"message": f"Document {document_id} deleted successfully"}

@app.post("/api/chat")
async def chat(request: dict):
    """Chat endpoint - returns a helpful message"""
    question = request.get('question', '')
    sys.stderr.write(f"\nChat request: {question}\n")
    sys.stderr.flush()
    return {
        "answer": f"I received your question: '{question}'. However, this is a test server without AI capabilities. Your document '{request.get('document_id', 'SE_Final-Unit-1-Notes.pdf')}' was uploaded successfully! To get AI-powered answers, you'll need to configure the main server with MongoDB and Google Gemini API.",
        "session_id": request.get("session_id", "test-session"),
        "sources": [],
        "document_id": request.get("document_id"),
        "question": question
    }

@app.post("/api/chat/follow-up")
async def follow_up(request: dict):
    """Generate follow-up questions"""
    return {
        "follow_up_questions": [
            "What are the key points in this document?",
            "Can you summarize this section?",
            "What are the main topics covered?"
        ]
    }

@app.post("/api/chat/summarize")
async def summarize(request: dict):
    """Summarize document"""
    return {
        "summary": "Document summary feature requires the full server with AI capabilities.",
        "document_id": request.get("document_id")
    }

@app.post("/api/chat/key-points")
async def key_points(request: dict):
    """Extract key points"""
    return {
        "key_points": [
            "This is a test server",
            "Document upload is working correctly",
            "Full AI features require the main server"
        ],
        "document_id": request.get("document_id")
    }

@app.get("/api/test")
async def test():
    """Test endpoint to verify server is working"""
    sys.stdout.write("\nTEST ENDPOINT HIT!\n")
    sys.stdout.flush()
    return {"status": "test endpoint working"}

@app.post("/api/upload")
async def upload(request: FastAPIRequest, file: UploadFile = File(...)):
    """Upload endpoint with detailed logging"""
    
    # Write to stderr instead to bypass any buffering
    sys.stderr.write("\n" + "="*60 + "\n")
    sys.stderr.write("UPLOAD ENDPOINT CALLED!!!\n")
    sys.stderr.write(f"File parameter: {file}\n")
    sys.stderr.write(f"File type: {type(file)}\n")
    sys.stderr.write(f"Content-Type header: {request.headers.get('content-type')}\n")
    
    # Try to get form data manually
    try:
        form = await request.form()
        sys.stderr.write(f"Form keys: {list(form.keys())}\n")
        for key in form.keys():
            sys.stderr.write(f"  {key}: {type(form[key])}\n")
    except Exception as e:
        sys.stderr.write(f"Error reading form: {e}\n")
    
    sys.stderr.write("="*60 + "\n")
    sys.stderr.flush()
    
    # Also write to stdout
    sys.stdout.write("\n" + "="*60 + "\n")
    sys.stdout.write("UPLOAD REQUEST RECEIVED\n")
    sys.stdout.write("="*60 + "\n")
    sys.stdout.flush()
    
    try:
        # Log file info
        sys.stderr.write(f"Filename: {file.filename}\n")
        sys.stderr.write(f"Content-Type: {file.content_type}\n")
        sys.stderr.flush()
        
        if not file or not file.filename:
            sys.stderr.write("ERROR: No file or filename\n")
            sys.stderr.flush()
            raise HTTPException(status_code=400, detail="No file")
        
        # Read content
        content = await file.read()
        size = len(content)
        sys.stdout.write(f"Size: {size} bytes\n")
        sys.stdout.flush()
        
        # Check extension
        ext = os.path.splitext(file.filename)[1].lower()
        sys.stdout.write(f"Extension: '{ext}'\n")
        sys.stdout.write(f"Extension (repr): {repr(ext)}\n")
        sys.stdout.flush()
        
        allowed = ['.pdf', '.docx', '.txt']
        sys.stdout.write(f"Allowed extensions: {allowed}\n")
        sys.stdout.write(f"Is extension in allowed? {ext in allowed}\n")
        sys.stdout.flush()
        
        # Manual check each extension
        sys.stdout.write(f"ext == '.pdf': {ext == '.pdf'}\n")
        sys.stdout.write(f"ext == '.docx': {ext == '.docx'}\n")
        sys.stdout.write(f"ext == '.txt': {ext == '.txt'}\n")
        sys.stdout.flush()
        
        if ext not in allowed:
            error = f"Invalid extension '{ext}'"
            sys.stdout.write(f"ERROR: {error}\n")
            sys.stdout.write("="*60 + "\n\n")
            sys.stdout.flush()
            raise HTTPException(status_code=422, detail=error)
        
        doc_id = str(uuid.uuid4())
        sys.stdout.write(f"SUCCESS! Document ID: {doc_id}\n")
        sys.stdout.write("="*60 + "\n\n")
        sys.stdout.flush()
        
        return {
            "document_id": doc_id,
            "filename": file.filename,
            "file_size": size,
            "status": "processed",
            "message": "Upload successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        sys.stdout.write(f"EXCEPTION: {str(e)}\n")
        sys.stdout.write("="*60 + "\n\n")
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("="*60)
    print("TEST UPLOAD SERVER STARTING")
    print("="*60)
    print("Server will run on http://localhost:8000")
    print("Try uploading a file and watch THIS terminal for debug output")
    print("="*60 + "\n")
    
    uvicorn.run(
        "test_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload to avoid caching issues
        log_level="info"
    )
