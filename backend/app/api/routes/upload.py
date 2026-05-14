from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
)

import os
import uuid

from datetime import datetime

from app.services.document_processor import (
    DocumentProcessor,
)

from app.services.vector_store import (
    VectorStore,
)

from app.models.schemas import (
    UploadResponse,
)

from app.services.database import (
    get_documents_collection,
)

from app.api.routes.auth import (
    get_current_user,
)

from app.core.config import settings

router = APIRouter()

document_processor = DocumentProcessor()

# Shared vector store
from app.api.routes.chat import (
    get_vector_store,
)


@router.get("/test")
async def test_endpoint():
    return {
        "message":
            "Upload router working",
        "status":
            "ok"
    }


# =========================
# UPLOAD DOCUMENT
# =========================

@router.post(
    "/upload",
    response_model=UploadResponse
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(
        get_current_user
    )
):

    try:
        print("\n=== UPLOAD STARTED ===")

        # =========================
        # AUTH CHECK
        # =========================

        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )

        print(
            f"Authenticated user: "
            f"{current_user.get('email')}"
        )

        # =========================
        # FILE VALIDATION
        # =========================

        if file is None:
            raise HTTPException(
                status_code=400,
                detail="No file uploaded"
            )

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Invalid filename"
            )

        print(
            f"Received file: "
            f"{file.filename}"
        )

        # READ FILE
        file_content = await file.read()

        file_size = len(file_content)

        print(
            f"File size: {file_size}"
        )

        # EMPTY FILE
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        # MAX SIZE 20MB
        max_size = 20 * 1024 * 1024

        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=(
                    "File exceeds 20MB limit"
                )
            )

        # FILE TYPE
        file_extension = os.path.splitext(
            file.filename
        )[1].lower()

        allowed_extensions = [
            ".pdf",
            ".docx",
            ".txt"
        ]

        if (
            file_extension
            not in allowed_extensions
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Only PDF, DOCX, TXT "
                    "files are allowed"
                )
            )

        print(
            f"File extension valid: "
            f"{file_extension}"
        )

        # =========================
        # SAVE FILE
        # =========================

        os.makedirs(
            settings.UPLOAD_FOLDER,
            exist_ok=True
        )

        unique_filename = (
            f"{uuid.uuid4()}"
            f"{file_extension}"
        )

        file_path = os.path.join(
            settings.UPLOAD_FOLDER,
            unique_filename
        )

        with open(file_path, "wb") as f:
            f.write(file_content)

        print(
            f"Saved file to: "
            f"{file_path}"
        )

        # =========================
        # PROCESS DOCUMENT
        # =========================

        user_id = str(
            current_user.get("_id")
            or current_user.get("id")
        )

        print(
            f"Processing document "
            f"for user: {user_id}"
        )

        result = (
            document_processor.process_document(
                file_path,
                file.filename,
                user_id
            )
        )

        print(
            "Document processed successfully"
        )

        # =========================
        # VECTOR STORE
        # =========================

        vector_store = get_vector_store()

        success = vector_store.add_documents(
            result["chunks"]
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to index "
                    "document"
                )
            )

        print(
            "Document added to "
            "vector store"
        )

        # =========================
        # SAVE TO MONGODB
        # =========================

        documents_collection = (
            get_documents_collection()
        )

        if documents_collection is not None:

            document_record = {
                "document_id":
                    result["document_id"],

                "filename":
                    result["filename"],

                "original_filename":
                    file.filename,

                "file_size":
                    result["file_size"],

                "user_id":
                    user_id,

                "uploaded_at":
                    datetime.utcnow(),

                "status":
                    "processed",

                "chunk_count":
                    len(result["chunks"])
            }

            await documents_collection.insert_one(
                document_record
            )

            print(
                "Saved document metadata "
                "to MongoDB"
            )

        # =========================
        # CLEANUP
        # =========================

        if os.path.exists(file_path):
            os.remove(file_path)

            print(
                "Temporary file removed"
            )

        # =========================
        # RESPONSE
        # =========================

        return UploadResponse(
            document_id=
                result["document_id"],

            filename=
                result["filename"],

            file_size=
                result["file_size"],

            status="processed",

            message=(
                "Document uploaded "
                "successfully"
            )
        )

    except HTTPException as e:

        print(
            f"HTTP ERROR: {e.detail}"
        )

        raise e

    except Exception as e:

        print(
            f"UPLOAD ERROR: {str(e)}"
        )

        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Upload failed: {str(e)}"
            )
        )


# =========================
# LIST DOCUMENTS
# =========================

@router.get("/documents")
async def list_documents(
    current_user: dict = Depends(
        get_current_user
    )
):

    try:
        documents_collection = (
            get_documents_collection()
        )

        if documents_collection is None:
            return {
                "documents": []
            }

        user_id = str(
            current_user.get("_id")
            or current_user.get("id")
        )

        documents = (
            await documents_collection.find(
                {"user_id": user_id}
            ).to_list(length=None)
        )

        return {
            "documents": [
                {
                    "document_id":
                        doc.get(
                            "document_id"
                        ),

                    "filename":
                        doc.get(
                            "filename"
                        ),

                    "file_size":
                        doc.get(
                            "file_size"
                        ),

                    "status":
                        doc.get(
                            "status"
                        ),

                    "uploaded_at":
                        doc.get(
                            "uploaded_at"
                        ),
                }
                for doc in documents
            ]
        }

    except Exception as e:

        print(
            f"LIST DOCS ERROR: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )