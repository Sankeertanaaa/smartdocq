from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.services.database import get_messages_collection, get_sessions_collection
from app.models.mongodb_models import MessageModel, SessionModel
from app.models.schemas import ChatHistoryResponse, ChatHistoryItem
from app.api.routes.auth import get_current_user, get_current_user_optional
import json
import os

router = APIRouter()

@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: Optional[str] = None, limit: int = 50, current_user: dict = Depends(get_current_user)):
    """
    Get chat history for a session or all sessions (user's own only, or all for admin)
    """
    try:
        messages_collection = get_messages_collection()
        
        # Get user_id and role from authenticated user
        user_id = str(current_user["_id"])
        user_role = current_user.get("role")
        
        if session_id:
            # Get history for specific session
            query = {"session_id": session_id}
            # Regular users can only see their own sessions or public sessions
            if user_role != "admin":
                query["$or"] = [{"user_id": user_id}, {"is_public": True}]
            cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
            messages = await cursor.to_list(length=limit)
            
            # Convert to ChatHistoryItem format
            history_items = []
            for msg in messages:
                # Ensure timestamp is properly formatted as ISO string
                timestamp = msg["timestamp"]
                print(f"🔍 MongoDB message timestamp: {timestamp}, Type: {type(timestamp)}")
                if isinstance(timestamp, datetime):
                    timestamp = timestamp.isoformat()
                elif not isinstance(timestamp, str):
                    timestamp = str(timestamp)

                history_items.append(ChatHistoryItem(
                    session_id=msg["session_id"],
                    question=msg["content"] if msg["message_type"] == "user" else "",
                    answer=msg["content"] if msg["message_type"] == "ai" else "",
                    timestamp=timestamp,
                    sources=msg.get("sources", [])
                ))
            
            # Get total count for this session
            total_count = await messages_collection.count_documents({"session_id": session_id})
            
            return ChatHistoryResponse(
                history=history_items,
                total_count=total_count
            )
        else:
            # Get all history
            query = {}
            # Regular users see only their own messages or public messages
            if user_role != "admin":
                query["$or"] = [{"user_id": user_id}, {"is_public": True}]
            cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
            messages = await cursor.to_list(length=limit)
            
            # Convert to ChatHistoryItem format
            history_items = []
            for msg in messages:
                # Ensure timestamp is properly formatted as ISO string
                timestamp = msg["timestamp"]
                if isinstance(timestamp, datetime):
                    timestamp = timestamp.isoformat()
                elif not isinstance(timestamp, str):
                    timestamp = str(timestamp)

                history_items.append(ChatHistoryItem(
                    session_id=msg["session_id"],
                    question=msg["content"] if msg["message_type"] == "user" else "",
                    answer=msg["content"] if msg["message_type"] == "ai" else "",
                    timestamp=timestamp,
                    sources=msg.get("sources", [])
                ))
            
            # Get total count
            total_count = await messages_collection.count_documents(query)

            return ChatHistoryResponse(
                history=history_items,
                total_count=total_count
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

@router.post("/history")
async def save_chat_history(chat_item: ChatHistoryItem, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """
    Save a chat interaction to history
    """
    try:
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()

        # Check if session is public
        session = await sessions_collection.find_one({"session_id": chat_item.session_id})
        is_public = session.get("is_public", False) if session else False

        # Determine user_id
        user_id = None
        if current_user:
            user_id = str(current_user.get("_id", current_user.get("id")))

        # Save user message
        user_message = MessageModel(
            session_id=chat_item.session_id,
            message_type="user",
            content=chat_item.question,
            timestamp=chat_item.timestamp,
            user_id=user_id,
            is_public=is_public
        )
        await messages_collection.insert_one(user_message.dict(by_alias=True))

        # Save AI message
        ai_message = MessageModel(
            session_id=chat_item.session_id,
            message_type="ai",
            content=chat_item.answer,
            sources=chat_item.sources,
            timestamp=chat_item.timestamp,
            user_id=user_id,
            is_public=is_public
        )
        await messages_collection.insert_one(ai_message.dict(by_alias=True))

        # Update session
        await sessions_collection.update_one(
            {"session_id": chat_item.session_id},
            {
                "$set": {
                    "last_activity": chat_item.timestamp,
                    "updated_at": datetime.utcnow().isoformat(),
                    "is_public": is_public
                },
                "$inc": {"message_count": 2}  # Increment by 2 (user + AI message)
            },
            upsert=True
        )

        return {"message": "Chat history saved successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chat history: {str(e)}")

@router.delete("/history/{session_id}")
async def delete_session_history(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete chat history for a specific session (only own sessions)
    """
    try:
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        # Verify session belongs to user
        user_id = str(current_user["_id"])
        session = await sessions_collection.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.get("user_id") != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete all messages for this session
        result = await messages_collection.delete_many({"session_id": session_id})
        
        # Delete session record
        await sessions_collection.delete_one({"session_id": session_id})
        
        if result.deleted_count > 0:
            return {"message": f"Session {session_id} history deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session history: {str(e)}")

@router.get("/history/sessions")
async def list_sessions(include_archived: bool = False, limit: int = 50, current_user: dict = Depends(get_current_user)):
    """
    List sessions for the authenticated user (or all for admin)
    """
    try:
        sessions_collection = get_sessions_collection()
        
        # Get user_id and role from authenticated user
        user_id = str(current_user["_id"])
        user_role = current_user.get("role")
        
        # Build query filter
        query_filter = {}

        # Admin sees all sessions, regular users see only their own or public sessions
        if user_role != "admin":
            query_filter["$or"] = [{"user_id": user_id}, {"is_public": True}]

        if not include_archived:
            query_filter["is_archived"] = {"$ne": True}
        
        # Get all sessions and handle sorting manually if needed
        cursor = sessions_collection.find(query_filter).limit(limit)
        sessions = await cursor.to_list(length=limit)
        
        # Sort sessions manually to handle missing fields
        def get_sort_key(session):
            last_activity = session.get("last_activity")
            if isinstance(last_activity, datetime):
                return last_activity
            elif isinstance(last_activity, str):
                return datetime.fromisoformat(last_activity)
            else:
                return datetime.min

        sessions.sort(key=get_sort_key, reverse=True)
        
        session_list = []
        for session in sessions:
            # Use current time as fallback for missing timestamps
            current_time = datetime.utcnow()
            last_activity = session.get("last_activity")
            created_at = session.get("created_at")
            
            # Provide reasonable defaults
            if not last_activity and not created_at:
                last_activity = created_at = current_time
            elif not last_activity:
                last_activity = created_at
            elif not created_at:
                created_at = last_activity
            
            session_list.append({
                "session_id": session["session_id"],
                "title": session.get("title", "New Chat"),
                "last_activity": last_activity.isoformat() if isinstance(last_activity, datetime) else last_activity,
                "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
                "message_count": session.get("message_count", 0),
                "user_id": session.get("user_id"),
                "is_guest": session.get("is_guest", False),
                "is_archived": session.get("is_archived", False),
                "is_public": session.get("is_public", False),
                "tags": session.get("tags", []),
                "summary": session.get("summary"),
                "document_ids": session.get("document_ids", [])
            })
        
        return {"sessions": session_list, "total": len(session_list)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")

@router.get("/history/sessions/{user_id}")
async def list_user_sessions(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    List sessions for a specific user (only if requesting own sessions or admin)
    """
    try:
        sessions_collection = get_sessions_collection()
        
        # Verify user can access these sessions
        current_user_id = str(current_user["_id"])
        if current_user_id != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        cursor = sessions_collection.find({"user_id": user_id}).sort("last_activity", -1)
        sessions = await cursor.to_list(length=None)
        
        session_list = []
        for session in sessions:
            # Ensure timestamps are properly formatted
            last_activity = session.get("last_activity")
            created_at = session.get("created_at")

            if isinstance(last_activity, datetime):
                last_activity = last_activity.isoformat()
            if isinstance(created_at, datetime):
                created_at = created_at.isoformat()

            session_list.append({
                "session_id": session["session_id"],
                "last_activity": last_activity,
                "message_count": session.get("message_count", 0),
                "title": session.get("title", "New Chat"),
                "created_at": created_at,
                "user_id": session.get("user_id"),
                "document_ids": session.get("document_ids", []),
                "is_public": session.get("is_public", False)
            })
        
        return {"sessions": session_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list user sessions: {str(e)}")

@router.get("/history/stats")
async def get_history_stats():
    """
    Get statistics about chat history
    """
    try:
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        total_sessions = await sessions_collection.count_documents({})
        total_messages = await messages_collection.count_documents({})
        
        # Calculate average messages per session
        avg_messages = total_messages / total_sessions if total_sessions > 0 else 0
        
        return {
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "average_messages_per_session": round(avg_messages, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history stats: {str(e)}")

@router.post("/history/sessions")
async def create_session(session_data: dict):
    """
    Create a new session
    """
    try:
        sessions_collection = get_sessions_collection()
        
        session = SessionModel(
            session_id=session_data.get("session_id"),
            user_id=session_data.get("user_id"),
            title=session_data.get("title"),
            is_guest=session_data.get("is_guest", False)
        )
        
        result = await sessions_collection.insert_one(session.dict(by_alias=True))
        
        if result.inserted_id:
            return {"message": "Session created successfully", "session_id": session.session_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to create session")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@router.put("/history/sessions/{session_id}")
async def update_session(session_id: str, update_data: dict):
    """
    Update session details (title, tags, archive status)
    """
    try:
        sessions_collection = get_sessions_collection()
        
        # Build update query
        update_fields = {"updated_at": datetime.utcnow().isoformat()}
        
        if "title" in update_data:
            update_fields["title"] = update_data["title"]
        if "tags" in update_data:
            update_fields["tags"] = update_data["tags"]
        if "is_archived" in update_data:
            update_fields["is_archived"] = update_data["is_archived"]
        if "summary" in update_data:
            update_fields["summary"] = update_data["summary"]
        
        result = await sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": update_fields}
        )
        
        if result.matched_count > 0:
            return {"message": "Session updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")

@router.post("/history/sessions/{session_id}/generate-title")
async def generate_session_title(session_id: str):
    """
    Auto-generate a title for the session based on the first few messages
    """
    try:
        from app.services.ai_service import AIService
        
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        # Get first few messages from the session
        cursor = messages_collection.find({"session_id": session_id}).sort("timestamp", 1).limit(6)
        messages = await cursor.to_list(length=6)
        
        if not messages:
            raise HTTPException(status_code=404, detail="No messages found in session")
        
        # Extract user questions for title generation
        user_messages = [msg["content"] for msg in messages if msg["message_type"] == "user"]
        
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user messages found")
        
        # Generate title using AI
        ai_service = AIService()
        context = "\n".join(user_messages[:3])  # Use first 3 user messages
        
        title_prompt = f"""
        Based on the following conversation start, generate a concise, descriptive title (max 50 characters):
        
        {context}
        
        Generate a title that captures the main topic or question. Be specific and concise.
        Return only the title, nothing else.
        """
        
        response = ai_service.model.generate_content(title_prompt)
        generated_title = response.text.strip().strip('"').strip("'")
        
        # Limit title length
        if len(generated_title) > 50:
            generated_title = generated_title[:47] + "..."
        
        # Update session with generated title
        await sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"title": generated_title, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        return {"title": generated_title, "message": "Title generated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate title: {str(e)}")

@router.post("/history/sessions/{session_id}/generate-summary")
async def generate_session_summary(session_id: str):
    """
    Generate an AI summary of the entire session
    """
    try:
        from app.services.ai_service import AIService
        
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        # Get all messages from the session
        cursor = messages_collection.find({"session_id": session_id}).sort("timestamp", 1)
        messages = await cursor.to_list(length=None)
        
        if not messages:
            raise HTTPException(status_code=404, detail="No messages found in session")
        
        # Format conversation for summary
        conversation = []
        for msg in messages:
            role = "User" if msg["message_type"] == "user" else "AI"
            conversation.append(f"{role}: {msg['content']}")
        
        conversation_text = "\n\n".join(conversation)
        
        # Generate summary using AI
        ai_service = AIService()
        
        summary_prompt = f"""
        Summarize the following conversation in 2-3 sentences. Focus on the main topics discussed and key insights provided:
        
        {conversation_text}
        
        Provide a concise summary that captures the essence of the conversation.
        """
        
        response = ai_service.model.generate_content(summary_prompt)
        generated_summary = response.text.strip()
        
        # Update session with generated summary
        await sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"summary": generated_summary, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        return {"summary": generated_summary, "message": "Summary generated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.get("/history/search")
async def search_chat_history(query: str, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """
    Search through chat history (user's own only)
    """
    try:
        messages_collection = get_messages_collection()
        sessions_collection = get_sessions_collection()
        
        # Get user_id from authenticated user
        user_id = str(current_user["_id"])
        user_role = current_user.get("role")
        
        # Build search filter - always filter by user_id or public sessions
        search_filter = {
            "$text": {"$search": query}
        }

        # Regular users can only search their own sessions or public sessions
        if user_role != "admin":
            search_filter["$or"] = [{"user_id": user_id}, {"is_public": True}]
        
        # Search messages
        cursor = messages_collection.find(
            search_filter,
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)
        
        messages = await cursor.to_list(length=limit)
        
        # Group results by session
        session_results = {}
        for msg in messages:
            session_id = msg["session_id"]
            if session_id not in session_results:
                session_results[session_id] = {
                    "session_id": session_id,
                    "messages": [],
                    "score": 0
                }
            
            session_results[session_id]["messages"].append({
                "content": msg["content"],
                "message_type": msg["message_type"],
                "timestamp": msg["timestamp"],  # MongoDB should return this as string, but ensure it is
                "score": msg.get("score", 0)
            })
            session_results[session_id]["score"] += msg.get("score", 0)
        
        # Get session details
        session_ids = list(session_results.keys())
        session_cursor = sessions_collection.find({"session_id": {"$in": session_ids}})
        sessions = await session_cursor.to_list(length=None)
        
        # Combine results
        results = []
        for session in sessions:
            session_id = session["session_id"]
            if session_id in session_results:
                results.append({
                    "session_id": session_id,
                    "title": session.get("title", "New Chat"),
                    "last_activity": session.get("last_activity"),
                    "messages": session_results[session_id]["messages"],
                    "relevance_score": session_results[session_id]["score"]
                })
        
        # Sort by relevance score
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return {"results": results, "total": len(results)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search chat history: {str(e)}")

@router.post("/history/sessions/{session_id}/archive")
async def archive_session(session_id: str):
    """
    Archive a session
    """
    try:
        sessions_collection = get_sessions_collection()
        
        result = await sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"is_archived": True, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count > 0:
            return {"message": "Session archived successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to archive session: {str(e)}")

@router.post("/history/sessions/{session_id}/unarchive")
async def unarchive_session(session_id: str):
    """
    Unarchive a session
    """
    try:
        sessions_collection = get_sessions_collection()
        
        result = await sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"is_archived": False, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count > 0:
            return {"message": "Session unarchived successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unarchive session: {str(e)}")

@router.get("/shared/{session_id}")
async def get_shared_session(session_id: str):
    """
    Get a public shared session (no authentication required)
    """
    try:
        sessions_collection = get_sessions_collection()
        messages_collection = get_messages_collection()
        
        # Check if session exists and is public
        session = await sessions_collection.find_one({
            "session_id": session_id,
            "is_public": True
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Shared session not found or not public")
        
        # Get messages for this session
        cursor = messages_collection.find({"session_id": session_id}).sort("timestamp", 1)
        messages = await cursor.to_list(length=None)
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            # Ensure timestamp is properly formatted as ISO string
            timestamp = msg["timestamp"]
            if isinstance(timestamp, datetime):
                timestamp = timestamp.isoformat()
            elif not isinstance(timestamp, str):
                timestamp = str(timestamp)

            formatted_messages.append({
                "type": msg["message_type"],
                "content": msg["content"],
                "timestamp": timestamp,
                "sources": msg.get("sources", [])
            })
        
        # Format session info
        session_info = {
            "session_id": session["session_id"],
            "title": session.get("title", "Shared Chat"),
            "created_at": session.get("created_at"),
            "message_count": session.get("message_count", 0),
            "is_public": True
        }
        
        return {
            "session": session_info,
            "messages": formatted_messages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shared session: {str(e)}")

@router.get("/public/stats")
async def get_public_stats():
    """
    Get public statistics for guest dashboard (no authentication required)
    """
    try:
        sessions_collection = get_sessions_collection()
        messages_collection = get_messages_collection()
        
        # Count public sessions
        public_sessions_count = await sessions_collection.count_documents({"is_public": True})
        
        # Get all public sessions to count messages and documents
        public_sessions_cursor = sessions_collection.find({"is_public": True})
        public_sessions = await public_sessions_cursor.to_list(length=None)
        
        # Count total messages in public sessions
        public_session_ids = [session["session_id"] for session in public_sessions]
        total_public_messages = 0
        unique_documents = set()
        
        if public_session_ids:
            # Count AI responses in public sessions
            ai_messages_count = await messages_collection.count_documents({
                "session_id": {"$in": public_session_ids},
                "message_type": "ai"
            })
            total_public_messages = ai_messages_count
            
            # Count unique documents from public sessions
            for session in public_sessions:
                if session.get("document_ids"):
                    for doc_id in session["document_ids"]:
                        unique_documents.add(doc_id)
        
        return {
            "public_responses": total_public_messages,
            "public_documents": len(unique_documents),
            "topics_covered": public_sessions_count,
            "total_public_sessions": public_sessions_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public stats: {str(e)}")

@router.get("/public/documents")
async def get_public_documents():
    """
    Get documents that are used in public sessions (no authentication required)
    """
    try:
        sessions_collection = get_sessions_collection()
        
        # Get all public sessions
        public_sessions_cursor = sessions_collection.find({"is_public": True})
        public_sessions = await public_sessions_cursor.to_list(length=None)
        
        # Collect unique document IDs from public sessions
        public_document_ids = set()
        for session in public_sessions:
            if session.get("document_ids"):
                for doc_id in session["document_ids"]:
                    public_document_ids.add(doc_id)
        
        return {
            "public_document_ids": list(public_document_ids),
            "total_public_documents": len(public_document_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public documents: {str(e)}")