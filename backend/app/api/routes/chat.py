from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ChatRequest, ChatResponse
from app.models.mongodb_models import MessageModel, SessionModel
from app.services.vector_store import VectorStore
from app.services.ai_service import AIService
from app.services.database import get_messages_collection, get_sessions_collection
from app.api.routes.auth import get_current_user
from typing import Optional
from datetime import datetime

router = APIRouter()
_vector_store = None  # Lazy initialization
_ai_service = None  # Lazy initialization

def get_vector_store():
    """Lazy initialization of VectorStore"""
    global _vector_store
    if _vector_store is None:
        print("🔧 Initializing VectorStore for chat...")
        _vector_store = VectorStore()
    return _vector_store

def get_ai_service():
    """Lazy initialization of AIService"""
    global _ai_service
    if _ai_service is None:
        print("🔧 Initializing AIService for chat...")
        _ai_service = AIService()
    return _ai_service

@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Ask a question about uploaded documents
    """
    try:
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        # Get user_id from authenticated user
        user_id = str(current_user["_id"])
        
        # Search for relevant chunks - increased for better context
        similar_chunks = vector_store.search_similar(
            query=request.question,
            n_results=10,  # Increased from 5 to 10 for more comprehensive context
            document_id=request.document_id
        )
        
        if not similar_chunks:
            answer = "I couldn't find any relevant information in the uploaded documents to answer your question. Please make sure you have uploaded a document and try asking a different question."
            sources = []
            session_id = request.session_id or "default_session"
            timestamp = datetime.utcnow()
            
            # Save user message
            user_message = MessageModel(
                session_id=session_id,
                user_id=user_id,
                message_type="user",
                content=request.question,
                document_id=request.document_id,
                timestamp=timestamp
            )
            await messages_collection.insert_one(user_message.dict(by_alias=True))
            
            # Save AI message
            ai_message = MessageModel(
                session_id=session_id,
                user_id=user_id,
                message_type="ai",
                content=answer,
                sources=sources,
                document_id=request.document_id,
                timestamp=timestamp
            )
            await messages_collection.insert_one(ai_message.dict(by_alias=True))
            
            # Update session with user_id
            await sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "last_activity": timestamp,
                        "updated_at": timestamp
                    },
                    "$inc": {"message_count": 2}
                },
                upsert=True
            )
            
            return ChatResponse(
                answer=answer,
                sources=sources,
                session_id=session_id,
                timestamp=timestamp
            )
        
        # Generate answer using AI
        ai_response = get_ai_service().generate_answer(
            question=request.question,
            context_chunks=similar_chunks,
            session_id=request.session_id
        )
        
        # Save user message
        user_message = MessageModel(
            session_id=ai_response["session_id"],
            user_id=user_id,
            message_type="user",
            content=request.question,
            document_id=request.document_id,
            timestamp=ai_response["timestamp"]
        )
        await messages_collection.insert_one(user_message.dict(by_alias=True))
        
        # Save AI message
        ai_message = MessageModel(
            session_id=ai_response["session_id"],
            user_id=user_id,
            message_type="ai",
            content=ai_response["answer"],
            sources=ai_response["sources"],
            document_id=request.document_id,
            timestamp=ai_response["timestamp"]
        )
        await messages_collection.insert_one(ai_message.dict(by_alias=True))
        
        # Update session and auto-generate title if this is the first interaction
        session_update = {
            "$set": {
                "user_id": user_id,
                "last_activity": ai_response["timestamp"],
                "updated_at": ai_response["timestamp"]
            },
            "$inc": {"message_count": 2}
        }
        
        # Add document_id to session if provided
        if request.document_id:
            session_update["$addToSet"] = {"document_ids": request.document_id}
        
        await sessions_collection.update_one(
            {"session_id": ai_response["session_id"]},
            session_update,
            upsert=True
        )
        
        # Auto-generate title if this is the first message in the session
        session_doc = await sessions_collection.find_one({"session_id": ai_response["session_id"]})
        if session_doc and session_doc.get("message_count", 0) == 2 and not session_doc.get("title"):
            try:
                # Generate title from the first question
                from app.services.ai_service import AIService
                ai_service_title = AIService()
                
                title_prompt = f"""
                Generate a concise, descriptive title (max 50 characters) for a chat session that starts with this question:
                
                "{request.question}"
                
                The title should capture the main topic. Be specific and concise. Return only the title.
                """
                
                title_response = ai_service_title.model.generate_content(title_prompt)
                generated_title = title_response.text.strip().strip('"').strip("'")
                
                # Limit title length
                if len(generated_title) > 50:
                    generated_title = generated_title[:47] + "..."
                
                # Update session with generated title
                await sessions_collection.update_one(
                    {"session_id": ai_response["session_id"]},
                    {"$set": {"title": generated_title}}
                )
            except Exception as title_error:
                print(f"Failed to generate session title: {title_error}")
                # Continue without title generation
        
        return ChatResponse(
            answer=ai_response["answer"],
            sources=ai_response["sources"],
            session_id=ai_response["session_id"],
            timestamp=ai_response["timestamp"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/chat/follow-up")
async def generate_follow_up_questions(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate follow-up questions based on current question and context
    """
    try:
        # Search for relevant chunks
        similar_chunks = vector_store.search_similar(
            query=request.question,
            n_results=3,
            document_id=request.document_id
        )
        
        if not similar_chunks:
            return {"follow_up_questions": []}
        
        # Generate follow-up questions
        follow_up_questions = get_ai_service().generate_follow_up_questions(
            context_chunks=similar_chunks,
            current_question=request.question
        )
        
        return {"follow_up_questions": follow_up_questions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up questions: {str(e)}")

@router.post("/chat/summarize")
async def summarize_document(document_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """
    Generate a summary of the uploaded document
    """
    try:
        if document_id:
            chunks = get_vector_store().get_document_chunks(document_id)
        else:
            # Get some random chunks for general summary
            chunks = get_vector_store().search_similar("summary", n_results=10)
        
        if not chunks:
            return {"summary": "No document content available for summarization."}
        
        # Generate summary
        summary = get_ai_service().summarize_document(chunks)
        
        return {"summary": summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.post("/chat/key-points")
async def extract_key_points(document_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """
    Extract key points from the uploaded document
    """
    try:
        if document_id:
            chunks = get_vector_store().get_document_chunks(document_id)
        else:
            # Get some random chunks for key points
            chunks = get_vector_store().search_similar("key points", n_results=10)
        
        if not chunks:
            return {"key_points": ["No document content available for key point extraction."]}
        
        # Extract key points
        key_points = get_ai_service().extract_key_points(chunks)
        
        return {"key_points": key_points}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract key points: {str(e)}") 