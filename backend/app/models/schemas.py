from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    question: str = Field(..., description="User's question")
    session_id: Optional[str] = Field(None, description="Session ID for conversation context")
    document_id: Optional[str] = Field(None, description="Document ID to query")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI-generated answer")
    sources: List[Dict[str, Any]] = Field(..., description="Source chunks used for answer")
    session_id: str = Field(..., description="Session ID")
    timestamp: datetime = Field(default_factory=datetime.now)

class UploadResponse(BaseModel):
    document_id: str = Field(..., description="Unique document ID")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    status: str = Field(..., description="Processing status")
    message: str = Field(..., description="Status message")

class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Session ID")
    question_id: str = Field(..., description="Question ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    comment: Optional[str] = Field(None, description="Optional feedback comment")

class FeedbackResponse(BaseModel):
    success: bool = Field(..., description="Feedback submission status")
    message: str = Field(..., description="Response message")

class ChatHistoryItem(BaseModel):
    session_id: str = Field(..., description="Session ID")
    question: str = Field(..., description="User question")
    answer: str = Field(..., description="AI answer")
    timestamp: datetime = Field(..., description="Timestamp")
    sources: List[Dict[str, Any]] = Field(..., description="Source chunks")

class ChatHistoryResponse(BaseModel):
    history: List[ChatHistoryItem] = Field(..., description="Chat history")
    total_count: int = Field(..., description="Total number of conversations")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Error details")

# Authentication Models
class UserCreate(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    role: str = Field(..., description="User role (student, guest)")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

class User(BaseModel):
    id: str = Field(..., description="User ID")
    fullName: str = Field(..., description="User's full name")
    email: str = Field(..., description="User's email address")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="User active status")

class UserResponse(BaseModel):
    id: str = Field(..., description="User ID")
    fullName: str = Field(..., description="User's full name")
    email: str = Field(..., description="User's email address")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="User active status")

class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type")
    user: User = Field(..., description="User information") 