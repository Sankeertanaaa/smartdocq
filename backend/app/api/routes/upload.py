from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import shutil
from typing import Optional
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStore
from app.models.schemas import UploadResponse, ErrorResponse
from app.core.config import settings
from app.api.routes.auth import get_current_user
import uuid

router = APIRouter()
document_processor = DocumentProcessor()
# Import the shared VectorStore instance from chat module
from app.api.routes.chat import get_vector_store
security = HTTPBearer(auto_error=False)

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify routing is working"""
    return {"message": "Upload router is working!", "status": "ok"}

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Get current user if authenticated, otherwise return None"""
    print(f"get_current_user_optional called with credentials: {credentials is not None}")
    if not credentials:
        print("No credentials provided")
        return None
    try:
        user = await get_current_user(credentials)
        print(f"User authenticated: {user.get('email') if user else 'None'}")
        return user
    except HTTPException as e:
        print(f"Authentication failed: {e.detail}")
        return None

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Upload and process a document for question answering
    """
    print("=== UPLOAD ENDPOINT REACHED ===")
    print(f"File object: {file}")
    print(f"File filename: {getattr(file, 'filename', 'NO FILENAME ATTR')}")
    print(f"Current user: {current_user}")
    
    try:
        print("Starting upload validation...")
        
        # Validate file
        if not file:
            print("ERROR: No file object provided")
            raise HTTPException(status_code=400, detail="No file provided")
            
        if not hasattr(file, 'filename') or not file.filename:
            print("ERROR: File has no filename")
            raise HTTPException(status_code=400, detail="No file provided")
        
        print(f"File received: {file.filename}")
        print(f"Current user: {current_user.get('email') if current_user else 'None'}")
        
        # Check file size
        print("Reading file content...")
        file_size = 0
        file_content = await file.read()
        file_size = len(file_content)
        print(f"File content read successfully, size: {file_size}")
        
        print(f"Received file upload request: {file.filename}, size: {file_size}")
        
        # Check if file content is empty
        if file_size == 0:
            error_msg = "File appears to be empty"
            print(f"Validation failed: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        # Simple validation - just check extension and size
        file_extension = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = ['.pdf', '.docx', '.txt']
        
        print(f"File extension: '{file_extension}', allowed: {allowed_extensions}")
        print(f"File name: '{file.filename}'")
        print(f"os.path.splitext result: {os.path.splitext(file.filename)}")
        print(f"file_extension == '.pdf': {file_extension == '.pdf'}")
        print(f"file_extension == '.docx': {file_extension == '.docx'}")
        print(f"file_extension in allowed_extensions: {file_extension in allowed_extensions}")
        
        # Additional check for files without extensions or edge cases
        if not file_extension:
            error_msg = f"File '{file.filename}' has no extension. Please ensure the file has a .pdf, .docx, or .txt extension."
            print(f"Validation failed: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        # Check if file extension is supported (re-enable validation)
        if file_extension not in allowed_extensions:
            error_msg = f"Invalid file format. Please upload a PDF, DOCX, or TXT file. Got: '{file_extension}' for file '{file.filename}'"
            print(f"Validation failed: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        if file_size > 20 * 1024 * 1024:  # 20MB
            error_msg = f"File too large. Maximum size is 20MB. Got: {file_size} bytes"
            print(f"Validation failed: {error_msg}")
            raise HTTPException(status_code=422, detail=error_msg)
        
        print(f"File validation passed: {file.filename} (extension: {file_extension}, size: {file_size})")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_FOLDER, unique_filename)
        
        # Save file temporarily using the content we already read
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        print(f"File saved to: {file_path}")
        print(f"File exists on disk: {os.path.exists(file_path)}")
        print(f"File size on disk: {os.path.getsize(file_path) if os.path.exists(file_path) else 'unknown'}")
        
        # Process document synchronously so chat can use it immediately
        user_id = None
        if current_user:
            user_id = str(current_user.get("_id", current_user.get("id")))
        
        print(f"Processing document with user_id: {user_id}")
        try:
            result = document_processor.process_document(file_path, file.filename, user_id)
            print(f"Document processing completed: {result['document_id']}")
        except Exception as e:
            print(f"Document processing failed: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Document processing failed: {str(e)}")
        
        # Add to vector store with better error handling
        success = False
        try:
            print(f"Adding {len(result['chunks'])} chunks to vector store...")
            success = get_vector_store().add_documents(result["chunks"])
            print(f"Vector store operation completed: {success}")
            
            if not success:
                raise Exception("Vector store returned False - indexing failed")
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Vector store operation failed: {error_msg}")
            import traceback
            traceback.print_exc()
            
            # Clean up temporary file before raising error
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Provide helpful error message
            if "memory" in error_msg.lower():
                raise HTTPException(
                    status_code=422, 
                    detail="Document too large - server ran out of memory. Try uploading a smaller file."
                )
            elif "timeout" in error_msg.lower():
                raise HTTPException(
                    status_code=422, 
                    detail="Document processing timed out. Try uploading a smaller file or try again later."
                )
            elif "model" in error_msg.lower() or "sentence" in error_msg.lower():
                raise HTTPException(
                    status_code=500, 
                    detail="Embedding model failed to load. Please contact administrator."
                )
            else:
                raise HTTPException(
                    status_code=422, 
                    detail=f"Failed to index document: {error_msg}"
                )
        
        # Save document metadata to MongoDB
        try:
            from app.services.database import get_documents_collection
            from datetime import datetime
            
            documents_collection = get_documents_collection()
            document_record = {
                "document_id": result["document_id"],
                "filename": result["filename"],
                "original_filename": file.filename,
                "file_size": result["file_size"],
                "user_id": user_id,
                "uploaded_at": datetime.utcnow(),
                "status": "processed",
                "chunk_count": len(result["chunks"])
            }
            await documents_collection.insert_one(document_record)
            print(f"✅ Document record saved to MongoDB: {result['document_id']}")
        except Exception as e:
            print(f"⚠️ Warning: Failed to save document to MongoDB: {str(e)}")
            # Don't fail the upload if MongoDB save fails
        
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Cleaned up temporary file: {file_path}")
        
        return UploadResponse(
            document_id=result["document_id"],
            filename=result["filename"],
            file_size=result["file_size"],
            status="processed",
            message="Document uploaded and processed successfully"
        )
        
    except ValueError as e:
        error_detail = str(e)
        print(f"ValueError in upload: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)
    except HTTPException as he:
        error_detail = he.detail
        print(f"HTTPException in upload: {error_detail}")
        print(f"HTTPException status code: {he.status_code}")
        raise he
    except Exception as e:
        error_detail = str(e)
        print(f"Unexpected error in upload: {error_detail}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {error_detail}")

async def process_document_background(file_path: str, filename: str):
    """
    Background task to process uploaded document
    """
    try:
        # Process document
        result = document_processor.process_document(file_path, filename)
        
        # Add to vector store
        success = get_vector_store().add_documents(result["chunks"])
        
        if not success:
            print(f"Failed to add document {filename} to vector store")
        
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
            
    except Exception as e:
        print(f"Error processing document {filename}: {str(e)}")
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/documents")
async def list_documents(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """
    List documents that user uploaded OR accessed in their chat sessions (or all for admin)
    """
    try:
        from app.services.database import get_sessions_collection
        
        stats = get_vector_store().get_collection_stats()
        all_docs = get_vector_store().list_documents()
        
        print(f"📚 Documents endpoint called")
        print(f"   Total docs in vector store: {len(all_docs)}")
        print(f"   Total chunks: {stats['total_chunks']}")
        
        # If no user is authenticated, return empty list
        if not current_user:
            print("   ❌ No user authenticated")
            return {
                "total_chunks": 0,
                "collection_name": stats["collection_name"],
                "documents": []
            }
        
        user_id = str(current_user.get("_id", current_user.get("id")))
        user_role = current_user.get("role")
        print(f"   User: {current_user.get('email')} (ID: {user_id}, Role: {user_role})")
        
        # If user is admin, return all documents
        if user_role == "admin":
            print(f"   ✅ Admin user - returning all {len(all_docs)} documents")
            return {
                "total_chunks": stats["total_chunks"],
                "collection_name": stats["collection_name"],
                "documents": all_docs
            }
        
        # For regular users, show documents they uploaded OR accessed in sessions
        print(f"   🔍 Finding documents for user {user_id}")
        
        # Get document IDs from user's sessions
        sessions_collection = get_sessions_collection()
        user_sessions = await sessions_collection.find({"user_id": user_id}).to_list(length=None)
        
        accessed_doc_ids = set()
        for session in user_sessions:
            doc_ids = session.get("document_ids", [])
            accessed_doc_ids.update(doc_ids)
        
        print(f"   📋 User has accessed {len(accessed_doc_ids)} documents in sessions")
        
        user_docs = []
        
        for doc in all_docs:
            doc_id = doc["document_id"]
            
            # Check if document belongs to user by checking chunks
            doc_chunks = get_vector_store().get_document_chunks(doc_id)
            print(f"      Doc {doc_id[:20]}... has {len(doc_chunks)} chunks")
            
            if doc_chunks:
                # Check first chunk for user_id
                first_chunk_metadata = doc_chunks[0].get("metadata", {})
                chunk_user_id = first_chunk_metadata.get("user_id")
                
                # Include if: user uploaded it OR user accessed it in a session
                if chunk_user_id == user_id:
                    print(f"         ✅ User uploaded - adding")
                    user_docs.append(doc)
                elif doc_id in accessed_doc_ids:
                    print(f"         ✅ User accessed in session - adding")
                    user_docs.append(doc)
                else:
                    print(f"         ❌ Not user's document (owner: {chunk_user_id})")
        
        print(f"   📊 Returning {len(user_docs)} documents for user")
        
        return {
            "total_chunks": len([chunk for doc in user_docs for chunk in get_vector_store().get_document_chunks(doc["document_id"])]),
            "collection_name": stats["collection_name"],
            "documents": user_docs
        }
    except Exception as e:
        print(f"❌ Error in list_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and all its chunks
    """
    try:
        success = get_vector_store().delete_document(document_id)
        if success:
            return {"message": f"Document {document_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}") 