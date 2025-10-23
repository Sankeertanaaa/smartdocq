from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.services.database import get_documents_collection, get_sessions_collection, get_messages_collection
from app.services.ai_service import AIService
from app.api.routes.auth import get_current_user
import json

router = APIRouter()
ai_service = AIService()

@router.get("/personal-study-guide")
async def get_personal_study_guide(current_user: dict = Depends(get_current_user)):
    """
    Generate a personalized study guide based on user's documents and activity
    """
    try:
        user_id = str(current_user["_id"])
        user_role = current_user.get("role")

        # Get user's documents
        documents_collection = get_documents_collection()
        user_documents = await documents_collection.find({"user_id": user_id}).to_list(length=None)

        # Get user's chat sessions and messages
        sessions_collection = get_sessions_collection()
        user_sessions = await sessions_collection.find({"user_id": user_id}).to_list(length=None)

        messages_collection = get_messages_collection()
        user_messages = await messages_collection.find({"user_id": user_id}).to_list(length=None)

        # Generate personalized study guide using AI
        study_guide_data = await generate_study_guide_content(
            user_documents,
            user_sessions,
            user_messages,
            current_user
        )

        return {
            "success": True,
            "data": study_guide_data,
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study guide: {str(e)}")

@router.get("/document-summary")
async def get_document_summary(current_user: dict = Depends(get_current_user)):
    """
    Generate a summary of user's uploaded documents
    """
    try:
        user_id = str(current_user["_id"])

        # Get user's documents
        documents_collection = get_documents_collection()
        user_documents = await documents_collection.find({"user_id": user_id}).to_list(length=None)

        # Generate document summary using AI
        summary_data = await generate_document_summary(user_documents, current_user)

        return {
            "success": True,
            "data": summary_data,
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate document summary: {str(e)}")

@router.get("/learning-progress")
async def get_learning_progress(current_user: dict = Depends(get_current_user)):
    """
    Get user's learning progress statistics
    """
    try:
        user_id = str(current_user["_id"])

        # Get user's documents count
        documents_collection = get_documents_collection()
        documents_count = await documents_collection.count_documents({"user_id": user_id})

        # Get user's sessions count
        sessions_collection = get_sessions_collection()
        sessions_count = await sessions_collection.count_documents({"user_id": user_id})

        # Get user's messages count
        messages_collection = get_messages_collection()
        messages_count = await messages_collection.count_documents({"user_id": user_id})

        # Get recent activity (last 7 days)
        seven_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_sessions = await sessions_collection.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": seven_days_ago}
        })

        return {
            "success": True,
            "data": {
                "total_documents": documents_count,
                "total_sessions": sessions_count,
                "total_messages": messages_count,
                "recent_sessions": recent_sessions,
                "study_streak": calculate_study_streak(user_id, sessions_collection),
                "average_session_duration": await calculate_average_session_duration(user_id, sessions_collection)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get learning progress: {str(e)}")

async def generate_study_guide_content(documents, sessions, messages, user):
    """Generate personalized study guide content using AI"""
    try:
        # Prepare context for AI
        context = {
            "user_info": {
                "name": user.get("fullName", "Student"),
                "email": user.get("email", ""),
                "role": user.get("role", "student")
            },
            "documents": [
                {
                    "filename": doc.get("filename", "Unknown"),
                    "upload_date": doc.get("upload_date", ""),
                    "file_type": doc.get("file_type", "unknown"),
                    "summary": doc.get("summary", "")
                }
                for doc in documents
            ],
            "sessions": [
                {
                    "session_id": str(session.get("_id")),
                    "created_at": session.get("created_at", ""),
                    "message_count": len([msg for msg in messages if str(msg.get("session_id")) == str(session.get("_id"))])
                }
                for session in sessions
            ],
            "total_documents": len(documents),
            "total_sessions": len(sessions),
            "total_messages": len(messages)
        }

        # Create prompt for AI
        prompt = f"""
        Generate a personalized study guide for a student based on the following information:

        USER PROFILE:
        - Name: {context['user_info']['name']}
        - Role: {context['user_info']['role']}
        - Total Documents Uploaded: {context['total_documents']}
        - Total Study Sessions: {context['total_sessions']}
        - Total Messages/Interactions: {context['total_messages']}

        UPLOADED DOCUMENTS:
        {json.dumps(context['documents'], indent=2)}

        RECENT SESSIONS:
        {json.dumps(context['sessions'], indent=2)}

        Please create a comprehensive, personalized study guide that includes:

        1. LEARNING PROGRESS OVERVIEW:
        - Current progress summary
        - Strengths and areas for improvement
        - Study streak and consistency metrics

        2. PERSONALIZED RECOMMENDATIONS:
        - 3 specific skill areas to focus on (High/Medium priority)
        - Progress indicators for each area (0-100%)
        - Practical tips for improvement

        3. 3-WEEK STUDY PLAN:
        - Week 1: Foundation building activities
        - Week 2: Skill development activities
        - Week 3: Application and review activities

        4. RECOMMENDED RESOURCES:
        - 3 relevant external resources or tools
        - Brief descriptions of how they help

        Format the response as a JSON object with the following structure:
        {{
            "learning_progress": {{
                "total_documents": number,
                "total_sessions": number,
                "average_score": number (70-95),
                "study_streak": number (1-30)
            }},
            "recommendations": [
                {{
                    "title": "string",
                    "description": "string",
                    "priority": "High" or "Medium",
                    "progress": number (0-100),
                    "tips": ["string", "string", "string"]
                }},
                // 2 more recommendations
            ],
            "study_plan": [
                {{
                    "week": number,
                    "title": "string",
                    "topics": ["string", "string"],
                    "activities": ["string", "string", "string"]
                }},
                // 2 more weeks
            ],
            "resources": [
                {{
                    "title": "string",
                    "description": "string",
                    "type": "PDF" or "Interactive" or "Video",
                    "url": "string"
                }},
                // 2 more resources
            ]
        }}

        Make the recommendations specific and actionable based on their actual usage patterns.
        """

        # Generate response using AI
        response = ai_service.model.generate_content(prompt)
        response_text = ai_service._extract_response_text(response)

        # Try to parse JSON response
        try:
            # Clean the response text to extract JSON
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_content = response_text[json_start:json_end]
                study_guide = json.loads(json_content)
            else:
                # Fallback if JSON parsing fails
                study_guide = generate_fallback_study_guide(context)

        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            study_guide = generate_fallback_study_guide(context)

        return {
            "id": str(user.get("_id")),
            "title": f"{context['user_info']['name']}'s Personal Study Guide",
            "generated_date": datetime.utcnow().isoformat().split('T')[0],
            "user_info": context["user_info"],
            "learning_progress": study_guide.get("learning_progress", context),
            "recommendations": study_guide.get("recommendations", []),
            "study_plan": study_guide.get("study_plan", []),
            "resources": study_guide.get("resources", [])
        }

    except Exception as e:
        print(f"Error generating study guide: {str(e)}")
        # Return fallback data
        return generate_fallback_study_guide({
            "user_info": {
                "name": user.get("fullName", "Student"),
                "email": user.get("email", ""),
                "role": user.get("role", "student")
            },
            "total_documents": len(documents),
            "total_sessions": len(sessions),
            "total_messages": len(messages)
        })

async def generate_document_summary(documents, user):
    """Generate a summary of user's documents using AI"""
    try:
        if not documents:
            return {
                "total_documents": 0,
                "summary": "No documents uploaded yet. Start by uploading your study materials to get personalized summaries.",
                "key_topics": [],
                "recommendations": []
            }

        # Prepare document context
        doc_context = []
        for doc in documents:
            doc_context.append({
                "filename": doc.get("filename", "Unknown"),
                "upload_date": doc.get("upload_date", ""),
                "file_type": doc.get("file_type", "unknown"),
                "summary": doc.get("summary", ""),
                "content_preview": doc.get("content", "")[:500] if doc.get("content") else ""
            })

        prompt = f"""
        Analyze the following documents uploaded by {user.get('fullName', 'Student')} and create a comprehensive summary:

        DOCUMENTS:
        {json.dumps(doc_context, indent=2)}

        Please provide a structured summary that includes:

        1. OVERVIEW:
        - Total number of documents
        - Main subject areas covered
        - Overall complexity level

        2. KEY TOPICS IDENTIFIED:
        - List of main topics/themes (5-10 items)
        - Frequency of each topic if applicable

        3. CONTENT ANALYSIS:
        - Common themes or patterns
        - Gaps in coverage
        - Potential areas for deeper study

        4. STUDY RECOMMENDATIONS:
        - Specific areas to focus on
        - Suggested learning sequence
        - Additional topics to explore

        Format as JSON with structure:
        {{
            "total_documents": number,
            "summary": "paragraph summary",
            "key_topics": ["topic1", "topic2", ...],
            "content_analysis": {{
                "main_themes": ["theme1", "theme2"],
                "gaps": ["gap1", "gap2"],
                "complexity_level": "Beginner/Intermediate/Advanced"
            }},
            "recommendations": [
                "recommendation1",
                "recommendation2",
                "recommendation3"
            ]
        }}
        """

        # Generate response using AI
        response = ai_service.model.generate_content(prompt)
        response_text = ai_service._extract_response_text(response)

        # Try to parse JSON response
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_content = response_text[json_start:json_end]
                summary_data = json.loads(json_content)
            else:
                summary_data = generate_fallback_document_summary(doc_context)

        except json.JSONDecodeError:
            summary_data = generate_fallback_document_summary(doc_context)

        return summary_data

    except Exception as e:
        print(f"Error generating document summary: {str(e)}")
        return generate_fallback_document_summary([{
            "filename": doc.get("filename", "Unknown"),
            "upload_date": doc.get("upload_date", ""),
            "file_type": doc.get("file_type", "unknown")
        } for doc in documents])

def generate_fallback_study_guide(context):
    """Generate fallback study guide when AI fails"""
    return {
        "learning_progress": {
            "total_documents": context.get("total_documents", 0),
            "total_sessions": context.get("total_sessions", 0),
            "average_score": 75,
            "study_streak": 3
        },
        "recommendations": [
            {
                "title": "Document Analysis Skills",
                "description": "Focus on improving your ability to extract key information from complex documents.",
                "priority": "High",
                "progress": 65,
                "tips": [
                    "Read abstracts and conclusions first",
                    "Identify key terms and concepts",
                    "Practice summarizing main arguments"
                ]
            },
            {
                "title": "Research Question Formulation",
                "description": "Develop stronger research questions to guide your learning process.",
                "priority": "Medium",
                "progress": 45,
                "tips": [
                    "Use the 5W1H method (What, Why, When, Where, Who, How)",
                    "Make questions specific and answerable",
                    "Consider the scope and feasibility"
                ]
            },
            {
                "title": "Critical Thinking Development",
                "description": "Enhance your analytical skills and critical evaluation of information.",
                "priority": "Medium",
                "progress": 80,
                "tips": [
                    "Evaluate source credibility",
                    "Identify biases and assumptions",
                    "Consider alternative perspectives"
                ]
            }
        ],
        "study_plan": [
            {
                "week": 1,
                "title": "Foundation Building",
                "topics": ["Document structure analysis", "Key information extraction", "Basic summarization"],
                "activities": ["Upload 3 new documents", "Complete 5 chat sessions", "Create personal summaries"]
            },
            {
                "week": 2,
                "title": "Skill Development",
                "topics": ["Advanced question formulation", "Critical analysis", "Source evaluation"],
                "activities": ["Practice with complex documents", "Analyze research papers", "Compare multiple sources"]
            },
            {
                "week": 3,
                "title": "Application & Review",
                "topics": ["Real-world application", "Integration of concepts", "Self-assessment"],
                "activities": ["Apply skills to new materials", "Review progress", "Plan next steps"]
            }
        ],
        "resources": [
            {
                "title": "Academic Writing Guide",
                "description": "Improve your academic writing skills",
                "type": "PDF",
                "url": "/resources/academic-writing.pdf"
            },
            {
                "title": "Research Methods",
                "description": "Learn essential research methodologies",
                "type": "Interactive",
                "url": "/resources/research-methods"
            },
            {
                "title": "Critical Thinking Toolkit",
                "description": "Tools and techniques for better analysis",
                "type": "PDF",
                "url": "/resources/critical-thinking.pdf"
            }
        ]
    }

def generate_fallback_document_summary(documents):
    """Generate fallback document summary when AI fails"""
    return {
        "total_documents": len(documents),
        "summary": f"Summary of {len(documents)} uploaded documents. These documents cover various topics and represent your learning materials.",
        "key_topics": ["Document Analysis", "Research", "Academic Content"],
        "content_analysis": {
            "main_themes": ["Education", "Research", "Analysis"],
            "gaps": ["Additional resources may be needed for comprehensive coverage"],
            "complexity_level": "Intermediate"
        },
        "recommendations": [
            "Continue uploading diverse materials for comprehensive learning",
            "Focus on areas that need more coverage",
            "Regularly review and summarize your documents"
        ]
    }

async def calculate_study_streak(user_id, sessions_collection):
    """Calculate user's current study streak"""
    try:
        # Get sessions from last 30 days
        thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        sessions = await sessions_collection.find({
            "user_id": user_id,
            "created_at": {"$gte": thirty_days_ago}
        }).sort("created_at", -1).to_list(length=None)

        if not sessions:
            return 0

        # Calculate streak
        streak = 0
        current_date = datetime.utcnow().date()

        for i in range(30):  # Check last 30 days
            check_date = current_date.replace(day=current_date.day - i)
            has_session = any(
                session.get("created_at", "").date() == check_date
                for session in sessions
            )

            if has_session:
                streak += 1
            else:
                break

        return streak

    except Exception as e:
        print(f"Error calculating study streak: {str(e)}")
        return 0

async def calculate_average_session_duration(user_id, sessions_collection):
    """Calculate average session duration"""
    try:
        # This is a placeholder - actual implementation would need session duration tracking
        return 25  # minutes
    except Exception as e:
        print(f"Error calculating average session duration: {str(e)}")
        return 0
