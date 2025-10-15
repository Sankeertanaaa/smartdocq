from fastapi import APIRouter, HTTPException
from app.models.schemas import FeedbackRequest, FeedbackResponse
from app.models.mongodb_models import FeedbackModel
from app.services.database import get_feedback_collection
from typing import List, Dict, Any
import json
import os
from datetime import datetime

router = APIRouter()

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit feedback for an AI response
    """
    try:
        feedback_collection = get_feedback_collection()
        
        # Create feedback entry
        feedback_entry = FeedbackModel(
            session_id=feedback.session_id,
            message_id=feedback.question_id,
            rating=feedback.rating,
            comment=feedback.comment,
            timestamp=datetime.utcnow()
        )
        
        # Store feedback in MongoDB
        result = await feedback_collection.insert_one(feedback_entry.dict(by_alias=True))
        
        if result.inserted_id:
            return FeedbackResponse(
                success=True,
                message="Feedback submitted successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save feedback")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

@router.get("/feedback")
async def get_feedback_stats():
    """
    Get feedback statistics
    """
    try:
        feedback_collection = get_feedback_collection()
        
        total_feedback = await feedback_collection.count_documents({})
        
        if total_feedback == 0:
            return {
                "total_feedback": 0,
                "average_rating": 0,
                "rating_distribution": {},
                "recent_feedback": []
            }
        
        # Get all feedback for calculations
        cursor = feedback_collection.find({})
        all_feedback = await cursor.to_list(length=None)
        
        # Calculate statistics
        ratings = [f["rating"] for f in all_feedback]
        average_rating = sum(ratings) / len(ratings)
        
        # Rating distribution
        rating_distribution = {}
        for rating in range(1, 6):
            rating_distribution[rating] = ratings.count(rating)
        
        # Recent feedback (last 10) with user info
        recent_cursor = feedback_collection.find({}).sort("timestamp", -1).limit(10)
        recent_feedback_raw = await recent_cursor.to_list(length=10)
        
        # Enhance with user information if available
        from app.services.database import get_sessions_collection, get_users_collection
        from bson import ObjectId
        sessions_collection = get_sessions_collection()
        users_collection = get_users_collection()
        
        recent_feedback = []
        for feedback in recent_feedback_raw:
            enhanced_feedback = dict(feedback)
            
            # Get session info to find user
            if feedback.get("session_id"):
                session = await sessions_collection.find_one({"session_id": feedback["session_id"]})
                if session and session.get("user_id"):
                    # Convert user_id to ObjectId if it's a string
                    user_id = session["user_id"]
                    try:
                        if isinstance(user_id, str):
                            user_id = ObjectId(user_id)
                        user = await users_collection.find_one({"_id": user_id})
                        if user:
                            enhanced_feedback["user_name"] = user.get("full_name", "Unknown User")
                            enhanced_feedback["user_email"] = user.get("email", "")
                            enhanced_feedback["user_role"] = user.get("role", "student")
                    except Exception as e:
                        print(f"Error fetching user for feedback: {e}")
            
            # If still no user name, mark as anonymous
            if "user_name" not in enhanced_feedback:
                enhanced_feedback["user_name"] = "Anonymous User"
                enhanced_feedback["user_role"] = "guest"
            
            recent_feedback.append(enhanced_feedback)
        
        return {
            "total_feedback": total_feedback,
            "average_rating": round(average_rating, 2),
            "rating_distribution": rating_distribution,
            "recent_feedback": recent_feedback
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feedback stats: {str(e)}")

@router.get("/feedback/session/{session_id}")
async def get_session_feedback(session_id: str):
    """
    Get feedback for a specific session
    """
    try:
        feedback_collection = get_feedback_collection()
        
        cursor = feedback_collection.find({"session_id": session_id}).sort("timestamp", -1)
        session_feedback = await cursor.to_list(length=None)
        
        return {
            "session_id": session_id,
            "feedback_count": len(session_feedback),
            "feedback": session_feedback
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session feedback: {str(e)}")

@router.get("/feedback/analytics")
async def get_feedback_analytics():
    """
    Get detailed feedback analytics
    """
    try:
        feedback_collection = get_feedback_collection()
        
        total_feedback = await feedback_collection.count_documents({})
        if total_feedback == 0:
            return {"message": "No feedback data available"}
        
        # Get all feedback
        cursor = feedback_collection.find({})
        all_feedback = await cursor.to_list(length=None)
        
        # Group by session
        session_feedback = {}
        for feedback in all_feedback:
            session_id = feedback["session_id"]
            if session_id not in session_feedback:
                session_feedback[session_id] = []
            session_feedback[session_id].append(feedback)
        
        # Calculate session-level statistics
        session_stats = []
        for session_id, feedbacks in session_feedback.items():
            ratings = [f["rating"] for f in feedbacks]
            session_stats.append({
                "session_id": session_id,
                "feedback_count": len(feedbacks),
                "average_rating": round(sum(ratings) / len(ratings), 2),
                "last_feedback": max(feedbacks, key=lambda x: x["timestamp"])["timestamp"]
            })
        
        # Overall statistics
        all_ratings = [f["rating"] for f in all_feedback]
        overall_stats = {
            "total_feedback": len(all_feedback),
            "average_rating": round(sum(all_ratings) / len(all_ratings), 2),
            "total_sessions": len(session_feedback),
            "feedback_with_comments": len([f for f in all_feedback if f.get("comment")]),
            "top_rated_sessions": sorted(session_stats, key=lambda x: x["average_rating"], reverse=True)[:5]
        }
        
        return {
            "overall_stats": overall_stats,
            "session_stats": session_stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feedback analytics: {str(e)}")

@router.delete("/feedback/{session_id}")
async def delete_session_feedback(session_id: str):
    """
    Delete all feedback for a specific session
    """
    try:
        feedback_collection = get_feedback_collection()
        
        result = await feedback_collection.delete_many({"session_id": session_id})
        deleted_count = result.deleted_count
        
        return {
            "message": f"Deleted {deleted_count} feedback entries for session {session_id}",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session feedback: {str(e)}") 