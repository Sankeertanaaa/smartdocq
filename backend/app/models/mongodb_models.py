from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid objectid")

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.union_schema(
                [core_schema.is_instance_schema(ObjectId), core_schema.str_schema()]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema_, handler):
        json_schema = handler(core_schema_)
        json_schema.update(type="string")
        return json_schema


class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: str = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    hashed_password: str = Field(..., description="Hashed password")
    role: str = Field(default="student", description="User role")
    is_active: bool = Field(default=True, description="User active status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class SessionModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User ID (null for guest sessions)")
    title: Optional[str] = Field(None, description="Session title (auto-generated from first question)")
    is_guest: bool = Field(default=False, description="Whether this is a guest session")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    last_activity: datetime = Field(default_factory=datetime.utcnow, description="Last activity timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    message_count: int = Field(default=0, description="Number of messages in session")
    document_ids: List[str] = Field(default_factory=list, description="Associated document IDs")
    is_archived: bool = Field(default=False, description="Whether session is archived")
    is_public: bool = Field(default=False, description="Whether session is publicly shareable")
    tags: List[str] = Field(default_factory=list, description="User-defined tags for organization")
    summary: Optional[str] = Field(None, description="AI-generated session summary")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class MessageModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str = Field(..., description="Session ID")
    user_id: Optional[str] = Field(None, description="User ID (null for guest messages)")
    message_type: str = Field(..., description="Message type: 'user' or 'ai'")
    content: str = Field(..., description="Message content")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="Source documents/chunks")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    document_id: Optional[str] = Field(None, description="Associated document ID")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class FeedbackModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str = Field(..., description="Session ID")
    user_id: Optional[str] = Field(None, description="User ID (null for guest feedback)")
    message_id: Optional[str] = Field(None, description="Message ID being rated")
    rating: int = Field(..., description="Rating (1-5)")
    comment: Optional[str] = Field(None, description="Optional feedback comment")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Feedback timestamp")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class DocumentModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    document_id: str = Field(..., description="Unique document identifier")
    user_id: Optional[str] = Field(None, description="User ID (null for guest documents)")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    file_type: str = Field(..., description="File type/extension")
    upload_path: Optional[str] = Field(None, description="File upload path")
    is_processed: bool = Field(default=False, description="Whether document is processed")
    chunk_count: int = Field(default=0, description="Number of chunks created")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")
    processed_at: Optional[datetime] = Field(None, description="Processing completion timestamp")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )
