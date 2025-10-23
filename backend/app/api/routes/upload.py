from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
import uuid
from datetime import datetime
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStore
from app.models.schemas import UploadResponse, ErrorResponse
from app.services.database import get_documents_collection, get_sessions_collection
from app.api.routes.auth import get_current_user
from app.core.config import settings

router = APIRouter()
document_processor = DocumentProcessor()
# Import the shared VectorStore instance from chat module
from app.api.routes.chat import get_vector_store

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify routing is working"""
    return {"message": "Upload router is working!", "status": "ok"}

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
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
        print(f"Current user: {current_user.get('email')}")

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
            documents_collection = get_documents_collection()

            # Check if MongoDB is available
            if documents_collection is None:
                print(f"❌ MongoDB not available - documents_collection is None")
                raise HTTPException(
                    status_code=503,
                    detail="Document storage unavailable (database not connected)"
                )

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

            print(f"📄 Saving document record to MongoDB...")
            print(f"   Document ID: {result['document_id']}")
            print(f"   User ID: {user_id}")
            print(f"   Filename: {file.filename}")
            print(f"   File size: {result['file_size']}")
            print(f"   Chunk count: {len(result['chunks'])}")

            # Insert document record
            insert_result = await documents_collection.insert_one(document_record)

            if insert_result.inserted_id:
                print(f"✅ Document record saved to MongoDB: {result['document_id']}")
                print(f"   Inserted ID: {insert_result.inserted_id}")
            else:
                print(f"❌ Failed to save document record to MongoDB: {result['document_id']}")
                raise Exception("Document insert failed - no inserted_id returned")

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            error_msg = str(e)
            print(f"⚠️ Warning: Failed to save document to MongoDB: {error_msg}")
            import traceback
            traceback.print_exc()

            # For now, don't fail the upload if MongoDB save fails
            # But log this as a critical issue that needs investigation
            print("🚨 CRITICAL: Document upload succeeded but MongoDB save failed!")
            print("🚨 This means documents won't appear in the document library!")
            print(f"🚨 Document ID: {result['document_id']}, User ID: {user_id}")

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
async def list_documents(current_user: dict = Depends(get_current_user)):
    """
    List documents that user uploaded (or all for admin)
    """
    try:
        from app.services.database import get_documents_collection

        stats = get_vector_store().get_collection_stats()
        all_docs = get_vector_store().list_documents()

        print(f"📚 Documents endpoint called")
        print(f"   Total docs in vector store: {len(all_docs)}")
        print(f"   Total chunks: {stats['total_chunks']}")

        user_id = str(current_user.get("_id", current_user.get("id")))
        user_role = current_user.get("role")
        print(f"   User: {current_user.get('email')} (ID: {user_id}, Role: {user_role})")

        # If user is admin, return all documents
        if user_role == "admin":
            print(f"   ✅ Admin user - returning all {len(all_docs)} documents")
            documents_collection = get_documents_collection()

            # Get document metadata for all documents
            all_doc_records = await documents_collection.find({}).to_list(length=None)

            # Enhance documents with metadata
            enhanced_docs = []
            for doc in all_docs:
                doc_record = next((d for d in all_doc_records if d["document_id"] == doc["document_id"]), None)
                enhanced_doc = doc.copy()
                if doc_record:
                    enhanced_doc.update({
                        "user_email": doc_record.get("user_id")  # For admin reference
                    })
                enhanced_docs.append(enhanced_doc)

            return {
                "total_chunks": stats["total_chunks"],
                "collection_name": stats["collection_name"],
                "documents": enhanced_docs,
                "is_admin_view": True
            }

        # For regular users, get documents from MongoDB instead of just vector store
        print(f"   🔍 Finding documents for user {user_id}")

        # Get document metadata from MongoDB for this user
        documents_collection = get_documents_collection()

        # Check if MongoDB is available
        if documents_collection is None:
            print(f"❌ MongoDB not available - documents_collection is None")
            raise HTTPException(
                status_code=503,
                detail="Document retrieval unavailable (database not connected)"
            )

        print(f"   📄 Querying MongoDB for user documents...")
        user_doc_records = await documents_collection.find({"user_id": user_id}).to_list(length=None)

        print(f"   📄 Found {len(user_doc_records)} document records in MongoDB for user")
        for doc in user_doc_records:
            print(f"      - Doc ID: {doc['document_id']}, Filename: {doc.get('filename')}, User ID: {doc.get('user_id')}")

        if len(user_doc_records) == 0:
            print(f"   ⚠️ No documents found in MongoDB for user {user_id}")
            print(f"   This could mean: 1) No documents uploaded, 2) MongoDB save failed during upload, 3) User ID mismatch")

        # Convert to the format expected by frontend
        user_docs = []
        for doc_record in user_doc_records:
            # Get chunks for this document from vector store
            doc_chunks = get_vector_store().get_document_chunks(doc_record["document_id"])

            user_docs.append({
                "document_id": doc_record["document_id"],
                "filename": doc_record.get("filename", "Unknown"),
                "original_filename": doc_record.get("original_filename", doc_record.get("filename", "Unknown")),
                "file_size": doc_record.get("file_size", 0),
                "chunk_count": doc_record.get("chunk_count", len(doc_chunks)),
                "uploaded_at": doc_record.get("uploaded_at", ""),
                "status": doc_record.get("status", "unknown")
            })

        print(f"   📊 Returning {len(user_docs)} documents for user")

        return {
            "total_chunks": sum(doc.get("chunk_count", 0) for doc in user_docs),
            "collection_name": stats["collection_name"],
            "documents": user_docs
        }
    except Exception as e:
        print(f"❌ Error in list_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.get("/debug/documents")
async def debug_documents(current_user: dict = Depends(get_current_user)):
    """
    Debug endpoint to check MongoDB connection and document data
    """
    try:
        documents_collection = get_documents_collection()

        if documents_collection is None:
            return {
                "error": "MongoDB not available",
                "mongodb_status": "disconnected",
                "documents": []
            }

        # Get all documents from MongoDB
        all_docs = await documents_collection.find({}).to_list(length=None)

        # Get current user info
        user_id = str(current_user.get("_id", current_user.get("id")))
        user_email = current_user.get("email")

        # Filter user's documents
        user_docs = [doc for doc in all_docs if doc.get("user_id") == user_id]

        return {
            "mongodb_status": "connected",
            "total_documents_in_db": len(all_docs),
            "user_id": user_id,
            "user_email": user_email,
            "user_documents_in_db": len(user_docs),
            "user_documents": [
                {
                    "document_id": doc.get("document_id"),
                    "filename": doc.get("filename"),
                    "user_id": doc.get("user_id"),
                    "uploaded_at": doc.get("uploaded_at"),
                    "status": doc.get("status")
                }
                for doc in user_docs
            ],
            "all_documents": [
                {
                    "document_id": doc.get("document_id"),
                    "filename": doc.get("filename"),
                    "user_id": doc.get("user_id"),
                    "uploaded_at": doc.get("uploaded_at"),
                    "status": doc.get("status")
                }
                for doc in all_docs
            ]
        }

    except Exception as e:
        return {
            "error": str(e),
            "mongodb_status": "error",
            "documents": []
        } 