from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
import uuid

from app.services.vector_store import VectorStore
from app.services.ai_service import AIService
from app.services.document_processor import DocumentProcessor
from app.core.config import settings

router = APIRouter()
vector_store = VectorStore()
ai_service = AIService()
document_processor = DocumentProcessor()

# In-memory counters for demo question limits per session
DEMO_QUESTION_LIMIT = 3
demo_session_counts: Dict[str, int] = {}

# Sample documents to seed for demo
SAMPLE_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "document_id": "demo_research_paper",
        "filename": "Research_Paper_Intro_to_AI.pdf",
        "chunks": [
            {
                "id": "demo_research_paper_0",
                "document_id": "demo_research_paper",
                "chunk_index": 0,
                "filename": "Research_Paper_Intro_to_AI.pdf",
                "text": (
                    "Artificial Intelligence (AI) is the field of study concerned with building systems "
                    "that can perform tasks that typically require human intelligence, such as perception, "
                    "reasoning, learning, and decision-making. Machine Learning (ML) is a subfield of AI "
                    "focused on algorithms that improve performance with experience."
                ),
            },
            {
                "id": "demo_research_paper_1",
                "document_id": "demo_research_paper",
                "chunk_index": 1,
                "filename": "Research_Paper_Intro_to_AI.pdf",
                "text": (
                    "Supervised learning uses labeled data to learn mappings from inputs to outputs. "
                    "Common algorithms include linear regression, logistic regression, decision trees, and neural networks."
                ),
            },
        ],
        "description": "Introductory research paper on AI and ML fundamentals.",
    },
    {
        "document_id": "demo_user_manual",
        "filename": "SmartDevice_User_Manual.pdf",
        "chunks": [
            {
                "id": "demo_user_manual_0",
                "document_id": "demo_user_manual",
                "chunk_index": 0,
                "filename": "SmartDevice_User_Manual.pdf",
                "text": (
                    "Safety Instructions: Always disconnect the device from power before cleaning. "
                    "Do not expose the device to water or high humidity."
                ),
            },
            {
                "id": "demo_user_manual_1",
                "document_id": "demo_user_manual",
                "chunk_index": 1,
                "filename": "SmartDevice_User_Manual.pdf",
                "text": (
                    "Setup Guide: Download the companion app, create an account, and pair the device via Bluetooth. "
                    "Ensure firmware is updated for best performance."
                ),
            },
        ],
        "description": "Concise user manual with safety and setup instructions.",
    },
    {
        "document_id": "demo_study_notes",
        "filename": "Data_Structures_Study_Notes.txt",
        "chunks": [
            {
                "id": "demo_study_notes_0",
                "document_id": "demo_study_notes",
                "chunk_index": 0,
                "filename": "Data_Structures_Study_Notes.txt",
                "text": (
                    "Common data structures: arrays, linked lists, stacks, queues, hash tables, trees, and graphs. "
                    "Stacks follow LIFO, queues follow FIFO."
                ),
            },
            {
                "id": "demo_study_notes_1",
                "document_id": "demo_study_notes",
                "chunk_index": 1,
                "filename": "Data_Structures_Study_Notes.txt",
                "text": (
                    "Binary search trees allow average O(log n) search, insert, delete. "
                    "Balanced trees (e.g., AVL, Red-Black) maintain height near log n."
                ),
            },
        ],
        "description": "Study notes covering fundamental data structures.",
    },
]

def _ensure_samples_seeded() -> None:
    """Seed sample documents into the vector store if not already present."""
    try:
        existing_docs = {d.get("document_id") for d in vector_store.list_documents()}
        to_add_chunks: List[Dict[str, Any]] = []
        for sample in SAMPLE_DOCUMENTS:
            if sample["document_id"] not in existing_docs:
                to_add_chunks.extend(sample["chunks"])
        if to_add_chunks:
            vector_store.add_documents(to_add_chunks)
    except Exception as e:
        # Don't fail hard on seeding; demo can still operate if store is available later
        print(f"Demo seeding warning: {e}")


@router.get("/samples")
async def list_demo_samples():
    """Return demo sample documents metadata."""
    _ensure_samples_seeded()
    samples = [
        {
            "document_id": s["document_id"],
            "filename": s["filename"],
            "description": s["description"],
        }
        for s in SAMPLE_DOCUMENTS
    ]
    return {"samples": samples, "limit_per_session": DEMO_QUESTION_LIMIT}


@router.post("/chat")
async def demo_chat(payload: Dict[str, Any]):
    """Demo chat endpoint with 3-questions-per-session limit.
    Requires a document_id (from demo upload)."""

    question: Optional[str] = payload.get("question")
    session_id: Optional[str] = payload.get("session_id")
    document_id: Optional[str] = payload.get("document_id")

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")
    if not document_id:
        raise HTTPException(status_code=400, detail="document_id is required (upload a demo file first)")

    # Enforce question limit per session
    count = demo_session_counts.get(session_id, 0)
    if count >= DEMO_QUESTION_LIMIT:
        return {
            "answer": (
                "You've reached the demo limit of 3 questions per session. "
                "Register to unlock unlimited access and upload your own documents."
            ),
            "sources": [],
            "session_id": session_id,
            "timestamp": datetime.utcnow(),
            "limit_reached": True,
            "limit": DEMO_QUESTION_LIMIT,
        }

    # Retrieve similar chunks restricted to the provided demo document
    similar_chunks = vector_store.search_similar(
        query=question,
        n_results=5,
        document_id=document_id,
    )

    if not similar_chunks:
        demo_session_counts[session_id] = count + 1
        return {
            "answer": (
                "I could not find relevant information in the sample documents for this question. "
                "Try asking differently, or register to use your own documents."
            ),
            "sources": [],
            "session_id": session_id,
            "timestamp": datetime.utcnow(),
            "limit_reached": False,
            "limit": DEMO_QUESTION_LIMIT,
        }

    # Generate answer using AI on the retrieved context
    ai_response = ai_service.generate_answer(
        question=question,
        context_chunks=similar_chunks,
        session_id=session_id,
    )

    # Increment question count
    demo_session_counts[session_id] = count + 1

    return {
        "answer": ai_response["answer"],
        "sources": ai_response["sources"],
        "session_id": ai_response["session_id"],
        "timestamp": ai_response["timestamp"],
        "limit_reached": demo_session_counts[session_id] >= DEMO_QUESTION_LIMIT,
        "limit": DEMO_QUESTION_LIMIT,
    }


@router.post("/upload")
async def demo_upload(session_id: str, file: UploadFile = File(...)):
    """Allow guests to upload ONE demo file (pdf/docx/txt). The file is processed and indexed, then removed.
    Returns a temporary demo document_id that can be used in /api/demo/chat.
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Read to get size
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Validate using the same processor rules as normal uploads
    try:
        document_processor.validate_file(file.filename, file_size)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist temporarily to disk for processing
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"demo_{session_id}_{uuid.uuid4()}{file_extension}"
    temp_path = os.path.join(settings.UPLOAD_FOLDER, unique_filename)

    try:
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Process into chunks
        result = document_processor.process_document(temp_path, file.filename)

        # Add to vector store
        success = vector_store.add_documents(result["chunks"])
        if not success:
            raise RuntimeError("Failed to index demo document")

        # Derive counts
        chunk_count = len(result["chunks"]) if isinstance(result.get("chunks"), list) else 0

        return {
            "document_id": result["chunks"][0]["document_id"] if chunk_count > 0 else unique_filename,
            "filename": file.filename,
            "chunk_count": chunk_count,
            "message": "Demo document uploaded and indexed successfully",
        }
    finally:
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            # best-effort cleanup
            pass


