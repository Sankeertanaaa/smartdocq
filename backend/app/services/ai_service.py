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
                "answer": response.text,
                "question_id": question_id,
                "session_id": session_id or str(uuid.uuid4()),
                "sources": sources,
                "timestamp": datetime.utcnow(),
                "model_used": "gemini-2.5-flash"
            }
            
        except Exception as e:
            # Fallback response
            return {
                "answer": f"I apologize, but I encountered an error while processing your question: {str(e)}. Please try again or rephrase your question.",
                "question_id": str(uuid.uuid4()),
                "session_id": session_id or str(uuid.uuid4()),
                "sources": [],
                "timestamp": datetime.utcnow(),
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
            
            Return only the questions, one per line, without numbering.
            """
            
            response = self.model.generate_content(prompt)
            questions = [q.strip() for q in response.text.split('\n') if q.strip()]
            
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
            return response.text
            
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
            points = [point.strip().lstrip('- ').lstrip('* ').lstrip('• ') 
                     for point in response.text.split('\n') 
                     if point.strip() and not point.strip().startswith('---')]
            
            return points[:10]  # Return max 10 key points
            
        except Exception as e:
            return [f"Unable to extract key points due to an error: {str(e)}"] 