import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.core.config import settings
import uuid
from datetime import datetime

class AIService:
    def __init__(self):
        # Configure Gemini API
        print(f"🤖 Initializing Gemini AI with API key: {settings.GOOGLE_API_KEY[:20]}...")
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        # Use Gemini 2.5 Flash for reliable performance
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',  # Using stable Gemini 2.5 Flash
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Lower temperature for more accurate, focused responses
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
        )
        print("✅ Gemini AI initialized successfully")

        # Enhanced system prompt for maximum accuracy like Gemini
        self.system_prompt = """
        You are an expert document analysis AI with the same capabilities as Google's Gemini. Your goal is to provide highly accurate, comprehensive, and insightful answers based on document content.

        Core Principles:
        1. ACCURACY FIRST: Be extremely precise and factual. Only use information explicitly stated in the document.
        2. COMPREHENSIVE ANALYSIS: Thoroughly analyze all relevant information before responding.
        3. CONTEXTUAL UNDERSTANDING: Consider the broader context and relationships between different parts of the document.
        4. CLEAR REASONING: Show your analytical process when helpful.
        5. NUANCED RESPONSES: Capture subtleties, exceptions, and important details.

        Response Guidelines:
        - Start with a direct, accurate answer to the specific question asked
        - Provide comprehensive details and context from the document
        - Include relevant examples, data, or specific information when available
        - Explain relationships between concepts when relevant
        - Use clear, professional language while remaining accessible
        - Structure complex information logically
        - If information is incomplete, clearly state what is and isn't covered
        - Never fabricate or assume information not present in the document

        Quality Standards:
        - Match the depth and accuracy of Google Gemini's responses
        - Provide actionable insights when appropriate
        - Consider multiple perspectives if present in the document
        - Highlight key takeaways and important implications
        """

    def _extract_response_text(self, response) -> str:
        """Extract text from Gemini API response safely"""
        try:
            # Try the new format first (parts-based)
            if hasattr(response, 'parts') and response.parts:
                return response.parts[0].text
            elif hasattr(response, 'candidates') and response.candidates:
                # Access through candidates structure
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    return candidate.content.parts[0].text
                elif hasattr(candidate, 'text'):
                    return candidate.text
            elif hasattr(response, 'text'):
                # Fallback for simple text response
                return response.text
            else:
                # Last resort - convert to string
                return str(response)
        except Exception as e:
            print(f"❌ Error extracting response text: {str(e)}")
            return f"Error extracting response: {str(e)}"
    
    def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]], session_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate answer using RAG approach"""
        try:
            # Prepare context from chunks
            context_text = self._prepare_context(context_chunks)
            
            # Create enhanced prompt for maximum accuracy
            prompt = f"""
            {self.system_prompt}
            
            DOCUMENT CONTENT:
            {context_text}
            
            USER QUESTION: {question}
            
            ANALYSIS INSTRUCTIONS:
            1. First, carefully read and analyze all the provided document content
            2. Identify the specific information that directly addresses the user's question
            3. Consider the broader context and any related information
            4. Formulate a comprehensive, accurate response
            
            RESPONSE REQUIREMENTS:
            - Provide a direct, precise answer to the question
            - Include all relevant details and context from the document
            - Use specific information, data, examples, or quotes when available
            - Explain complex concepts clearly and thoroughly
            - Maintain high accuracy - only use information present in the document
            - Structure the response logically for easy understanding
            - If the document doesn't fully address the question, clearly state what information is available vs. what is missing
            
            Deliver a response that matches the quality and depth you would expect from Google Gemini when analyzing this document.
            """
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Generate unique question ID
            question_id = str(uuid.uuid4())
            
            # Prepare sources for citation
            sources = self._prepare_sources(context_chunks)
            
            return {
                "answer": self._extract_response_text(response),
                "question_id": question_id,
                "session_id": session_id or str(uuid.uuid4()),
                "sources": sources,
                "timestamp": datetime.utcnow().isoformat(),
                "model_used": "gemini-2.5-flash"
            }
            
        except Exception as e:
            # Fallback response
            return {
                "answer": f"I apologize, but I encountered an error while processing your question: {str(e)}. Please try again or rephrase your question.",
                "question_id": str(uuid.uuid4()),
                "session_id": session_id or str(uuid.uuid4()),
                "sources": [],
                "timestamp": datetime.utcnow().isoformat(),
                "model_used": "gemini-2.5-flash",
                "error": str(e)
            }
    
    def _prepare_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Prepare high-quality context text from retrieved chunks"""
        if not chunks:
            return ""
        
        # Sort chunks by relevance (lower distance = higher relevance)
        sorted_chunks = sorted(chunks, key=lambda x: x.get("distance", 1.0))
        
        context_parts = []
        seen_content = set()  # Avoid duplicate content
        
        for i, chunk in enumerate(sorted_chunks):
            chunk_text = chunk.get("text", "").strip()
            if not chunk_text:
                continue
                
            # Skip very similar content to avoid redundancy
            chunk_hash = hash(chunk_text[:200])  # Hash first 200 chars for similarity check
            if chunk_hash in seen_content:
                continue
            seen_content.add(chunk_hash)
            
            # Add metadata context for better understanding
            metadata = chunk.get("metadata", {})
            filename = metadata.get("filename", "")
            
            # Format the chunk with context
            if filename:
                context_parts.append(f"[From: {filename}]\n{chunk_text}")
            else:
                context_parts.append(chunk_text)
        
        # Join with clear separators
        return "\n\n---\n\n".join(context_parts)
    
    def _prepare_sources(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prepare source information for citations"""
        sources = []
        
        for chunk in chunks:
            metadata = chunk.get("metadata", {})
            sources.append({
                "text": chunk.get("text", "")[:200] + "..." if len(chunk.get("text", "")) > 200 else chunk.get("text", ""),
                "filename": metadata.get("filename", "Unknown"),
                "chunk_index": metadata.get("chunk_index", 0),
                "document_id": metadata.get("document_id", ""),
                "similarity_score": 1 - chunk.get("distance", 0)  # Convert distance to similarity
            })
        
        return sources
    
    def generate_follow_up_questions(self, context_chunks: List[Dict[str, Any]], current_question: str) -> List[str]:
        """Generate follow-up questions based on context"""
        try:
            context_text = self._prepare_context(context_chunks)
            
            prompt = f"""
            Based on the following document context and the current question, generate 3 relevant follow-up questions that would help explore the topic further.
            
            Document Context:
            {context_text}
            
            Current Question: {current_question}
            
            Generate 3 follow-up questions that are:
            1. Relevant to the document content
            2. Build upon the current question
            3. Help explore different aspects of the topic
            """
            
            response = self.model.generate_content(prompt)
            questions = [q.strip() for q in self._extract_response_text(response).split('\n') if q.strip()]
            
            return questions[:3]  # Return max 3 questions
            
        except Exception as e:
            return []
    
    def summarize_document(self, chunks: List[Dict[str, Any]]) -> str:
        """Generate a summary of the document"""
        try:
            context_text = self._prepare_context(chunks)
            
            prompt = f"""
            Please provide a comprehensive summary of the following document:
            
            {context_text}
            
            The summary should include:
            1. Main topics and themes
            2. Key findings or conclusions
            3. Important details or data points
            4. Overall structure and organization
            
            Keep the summary concise but informative.
            """
            
            response = self.model.generate_content(prompt)
            return self._extract_response_text(response)
            
        except Exception as e:
            return f"Unable to generate summary due to an error: {str(e)}"
    
    def extract_key_points(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Extract key points from the document"""
        try:
            context_text = self._prepare_context(chunks)
            
            prompt = f"""
            Extract the key points from the following document. Return them as a bulleted list:
            
            {context_text}
            
            Focus on:
            - Main arguments or claims
            - Important data or statistics
            - Key conclusions
            - Critical insights
            
            Return only the key points, one per line with a bullet point.
            """
            
            response = self.model.generate_content(prompt)
            response_text = self._extract_response_text(response)
            points = [point.strip().lstrip('- ').lstrip('* ').lstrip('• ') 
                     for point in response_text.split('\n') 
                     if point.strip() and not point.strip().startswith('---')]
            
            return points[:10]  # Return max 10 key points
            
        except Exception as e:
            return [f"Unable to extract key points due to an error: {str(e)}"]
        """Generate a personalized study guide based on user's learning data"""
        try:
            # Prepare comprehensive context
            context = self._prepare_study_guide_context(user_data, documents, sessions, messages)

            prompt = f"""
            You are an expert educational consultant creating a personalized study guide for a student. Based on the following comprehensive data about their learning journey, create a detailed, actionable study guide.

            STUDENT PROFILE:
            - Name: {context['user_info']['name']}
            - Role: {context['user_info']['role']}
            - Total Documents: {context['total_documents']}
            - Total Study Sessions: {context['total_sessions']}
            - Total Messages/Interactions: {context['total_messages']}
            - Study Streak: {context['study_streak']} days

            RECENT DOCUMENTS:
            {context['recent_documents']}

            RECENT SESSIONS:
            {context['recent_sessions']}

            CHAT PATTERNS:
            {context['chat_patterns']}

            Please create a comprehensive personalized study guide with the following sections:

            1. LEARNING PROGRESS OVERVIEW:
            - Current strengths and areas for improvement
            - Progress metrics and achievements
            - Study consistency analysis

            2. PERSONALIZED RECOMMENDATIONS:
            - 3 specific skill areas to focus on (High/Medium priority)
            - Progress indicators (0-100%)
            - Detailed tips for improvement
            - Specific actions to take

            3. 3-WEEK STUDY PLAN:
            - Week 1: Foundation building activities
            - Week 2: Skill development activities
            - Week 3: Application and review activities
            - Specific topics and activities for each week

            4. RECOMMENDED RESOURCES:
            - 3 relevant external resources or tools
            - How each resource helps their specific needs
            - Access information

            Format the response as a JSON object with this exact structure:
            {{
                "learning_progress": {{
                    "total_documents": {context['total_documents']},
                    "total_sessions": {context['total_sessions']},
                    "average_score": number between 70-95,
                    "study_streak": {context['study_streak']}
                }},
                "recommendations": [
                    {{
                        "title": "string",
                        "description": "string",
                        "priority": "High" or "Medium",
                        "progress": number between 0-100,
                        "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                    }}
                ],
                "study_plan": [
                    {{
                        "week": 1,
                        "title": "string",
                        "topics": ["topic 1", "topic 2"],
                        "activities": ["activity 1", "activity 2", "activity 3"]
                    }}
                ],
                "resources": [
                    {{
                        "title": "string",
                        "description": "string",
                        "type": "PDF" or "Interactive" or "Video",
                        "url": "string"
                    }}
                ]
            }}

            Make recommendations highly specific to their actual usage patterns, document types, and learning behaviors.
            """

            response = self.model.generate_content(prompt)
            response_text = self._extract_response_text(response)

            # Try to parse JSON response
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1

                if json_start != -1 and json_end > json_start:
                    json_content = response_text[json_start:json_end]
                    study_guide = json.loads(json_content)
                    return study_guide
                else:
                    return self._get_fallback_study_guide(context)

            except json.JSONDecodeError:
                return self._get_fallback_study_guide(context)

        except Exception as e:
            print(f"Error generating personalized study guide: {str(e)}")
            return self._get_fallback_study_guide({
                "user_info": {"name": "Student"},
                "total_documents": 0,
                "total_sessions": 0,
                "total_messages": 0,
                "study_streak": 0
            })

    def _prepare_study_guide_context(self, user_data, documents, sessions, messages):
        """Prepare context for study guide generation"""
        # Get recent documents (last 5)
        recent_docs = documents[-5:] if len(documents) > 5 else documents

        # Get recent sessions (last 5)
        recent_sessions = sessions[-5:] if len(sessions) > 5 else sessions

        # Analyze chat patterns
        chat_topics = []
        for msg in messages[-20:]:  # Last 20 messages
            content = msg.get('content', '').lower()
            if 'explain' in content or 'what is' in content:
                chat_topics.append('explanation')
            elif 'how' in content:
                chat_topics.append('procedural')
            elif 'why' in content:
                chat_topics.append('causal')
            elif any(word in content for word in ['analyze', 'analysis', 'break down']):
                chat_topics.append('analysis')

        # Count topic frequencies
        topic_counts = {}
        for topic in chat_topics:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

        return {
            "user_info": {
                "name": user_data.get("fullName", "Student"),
                "email": user_data.get("email", ""),
                "role": user_data.get("role", "student")
            },
            "total_documents": len(documents),
            "total_sessions": len(sessions),
            "total_messages": len(messages),
            "study_streak": self._calculate_study_streak(sessions),
            "recent_documents": json.dumps([{
                "filename": doc.get("filename", "Unknown"),
                "upload_date": doc.get("upload_date", ""),
                "file_type": doc.get("file_type", "unknown")
            } for doc in recent_docs], indent=2),
            "recent_sessions": json.dumps([{
                "session_id": str(session.get("_id")),
                "created_at": session.get("created_at", ""),
                "message_count": len([msg for msg in messages if str(msg.get("session_id")) == str(session.get("_id"))])
            } for session in recent_sessions], indent=2),
            "chat_patterns": json.dumps(topic_counts, indent=2)
        }

    def _calculate_study_streak(self, sessions):
        """Calculate current study streak from sessions"""
        if not sessions:
            return 0

        # Sort sessions by date
        sorted_sessions = sorted(sessions, key=lambda x: x.get("created_at", ""), reverse=True)

        if not sorted_sessions:
            return 0

        streak = 0
        current_date = datetime.utcnow().date()

        for i in range(30):  # Check last 30 days
            check_date = current_date.replace(day=current_date.day - i)
            has_session = any(
                session.get("created_at", "").date() == check_date
                for session in sorted_sessions
            )

            if has_session:
                streak += 1
            else:
                break

        return streak

    def _get_fallback_study_guide(self, context):
        """Generate fallback study guide when AI fails"""
        return {
            "learning_progress": {
                "total_documents": context.get("total_documents", 0),
                "total_sessions": context.get("total_sessions", 0),
                "average_score": 75,
                "study_streak": context.get("study_streak", 0)
            },
            "recommendations": [
                {
                    "title": "Document Analysis Enhancement",
                    "description": "Improve your ability to extract and understand key information from complex documents.",
                    "priority": "High",
                    "progress": 60,
                    "tips": [
                        "Read abstracts and conclusions first",
                        "Identify main arguments and supporting evidence",
                        "Practice creating summaries in your own words",
                        "Ask questions about implications and applications"
                    ]
                },
                {
                    "title": "Research Question Development",
                    "description": "Develop stronger research questions to guide your learning and analysis process.",
                    "priority": "Medium",
                    "progress": 45,
                    "tips": [
                        "Use the 5W1H framework (What, Why, When, Where, Who, How)",
                        "Make questions specific and answerable",
                        "Consider scope and feasibility",
                        "Align questions with learning objectives"
                    ]
                },
                {
                    "title": "Critical Thinking Skills",
                    "description": "Enhance analytical skills and evidence-based evaluation of information.",
                    "priority": "Medium",
                    "progress": 70,
                    "tips": [
                        "Evaluate source credibility and bias",
                        "Consider multiple perspectives",
                        "Look for evidence supporting claims",
                        "Draw logical conclusions from data"
                    ]
                }
            ],
            "study_plan": [
                {
                    "week": 1,
                    "title": "Foundation Building",
                    "topics": ["Document structure analysis", "Information extraction", "Basic summarization"],
                    "activities": [
                        "Upload 3 new academic documents",
                        "Complete 5 AI chat sessions",
                        "Create personal summaries of each document"
                    ]
                },
                {
                    "week": 2,
                    "title": "Skill Development",
                    "topics": ["Question formulation", "Critical analysis", "Source evaluation"],
                    "activities": [
                        "Practice asking complex questions",
                        "Analyze research papers critically",
                        "Compare multiple sources on same topic"
                    ]
                },
                {
                    "week": 3,
                    "title": "Application & Integration",
                    "topics": ["Real-world application", "Knowledge integration", "Self-assessment"],
                    "activities": [
                        "Apply concepts to new materials",
                        "Create comprehensive study guides",
                        "Review and assess your progress"
                    ]
                }
            ],
            "resources": [
                {
                    "title": "Academic Writing and Research Guide",
                    "description": "Comprehensive guide to academic writing, research methods, and critical analysis",
                    "type": "PDF",
                    "url": "/resources/academic-writing-research.pdf"
                },
                {
                    "title": "Critical Thinking Toolkit",
                    "description": "Interactive tools and exercises for developing analytical skills",
                    "type": "Interactive",
                    "url": "/resources/critical-thinking-interactive"
                },
                {
                    "title": "Research Methodology Video Series",
                    "description": "Step-by-step video tutorials on research methods and academic analysis",
                    "type": "Video Series",
                    "url": "/resources/research-methodology-videos"
                }
            ]
        } 