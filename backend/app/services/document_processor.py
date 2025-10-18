import os
import uuid
import PyPDF2  # Changed from fitz (PyMuPDF)
from docx import Document
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def process_document(self, file_path: str, filename: str, user_id: str = None) -> Dict[str, Any]:
        """Process uploaded document and return chunks with metadata"""
        print(f"Starting document processing for: {filename}")
        try:
            # Extract text based on file type
            print(f"Extracting text from: {file_path}")
            text = self._extract_text(file_path, filename)
            print(f"Extracted text length: {len(text) if text else 0} characters")
            
            # Check if text is empty
            if not text or len(text.strip()) == 0:
                raise Exception("No text could be extracted from the document")
            
            # Split text into chunks
            chunks = self._split_text(text)
            print(f"Split into {len(chunks)} chunks")
            
            # Limit chunks to prevent memory issues (max ~500 chunks = ~500KB of text)
            MAX_CHUNKS = 500
            if len(chunks) > MAX_CHUNKS:
                print(f"⚠️ Document has {len(chunks)} chunks, limiting to {MAX_CHUNKS}")
                chunks = chunks[:MAX_CHUNKS]
                print(f"⚠️ Warning: Document truncated to first {MAX_CHUNKS} chunks")
            
            # Generate document ID
            document_id = str(uuid.uuid4())
            
            # Prepare chunks with metadata
            processed_chunks = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    "id": f"{document_id}_chunk_{i}",
                    "text": chunk,
                    "document_id": document_id,
                    "chunk_index": i,
                    "filename": filename
                }
                if user_id:
                    chunk_metadata["user_id"] = user_id
                processed_chunks.append(chunk_metadata)
            
            print(f"✅ Document processed: {len(processed_chunks)} chunks ready")
            
            return {
                "document_id": document_id,
                "filename": filename,
                "chunks": processed_chunks,
                "total_chunks": len(processed_chunks),
                "file_size": os.path.getsize(file_path)
            }
            
        except Exception as e:
            print(f"❌ Error processing document {filename}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error processing document: {str(e)}")
    
    def _extract_text(self, file_path: str, filename: str) -> str:
        """Extract text from different file formats"""
        file_extension = os.path.splitext(filename)[1].lower()
        
        if file_extension == ".pdf":
            return self._extract_pdf_text(file_path)
        elif file_extension == ".docx":
            return self._extract_docx_text(file_path)
        elif file_extension == ".txt":
            return self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file using PyPDF2"""
        try:
            print(f"Extracting PDF text from: {file_path}")
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                print(f"PDF has {len(pdf_reader.pages)} pages")
                for i, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    text += page_text + "\n"
                    print(f"Extracted {len(page_text)} characters from page {i+1}")
            print(f"Total PDF text extracted: {len(text)} characters")
            return text
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            raise Exception(f"Error extracting PDF text: {str(e)}")
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            print(f"Extracting DOCX text from: {file_path}")
            doc = Document(file_path)
            text = ""
            paragraph_count = 0
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():  # Only add non-empty paragraphs
                    text += paragraph.text + "\n"
                    paragraph_count += 1
            print(f"Extracted {paragraph_count} paragraphs from DOCX")
            print(f"Total DOCX text extracted: {len(text)} characters")
            return text
        except Exception as e:
            print(f"Error extracting DOCX text: {str(e)}")
            raise Exception(f"Error extracting DOCX text: {str(e)}")
    
    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"Error extracting TXT text: {str(e)}")
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into meaningful chunks"""
        try:
            chunks = self.text_splitter.split_text(text)
            return [chunk.strip() for chunk in chunks if chunk.strip()]
        except Exception as e:
            raise Exception(f"Error splitting text: {str(e)}")
    
    def validate_file(self, filename: str, file_size: int) -> bool:
        """Validate uploaded file"""
        print(f"Validating file: '{filename}', size: {file_size}")
        
        # Check if filename is valid
        if not filename or not filename.strip():
            raise ValueError("Invalid filename")
        
        # Check file size
        if file_size <= 0:
            raise ValueError("File appears to be empty")
            
        if file_size > settings.MAX_FILE_SIZE:
            raise ValueError(f"File size ({file_size} bytes) exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes")
        
        # Clean filename and check file type
        clean_filename = filename.strip()
        # Handle special characters in filename
        file_extension = os.path.splitext(clean_filename)[1].lower()
        print(f"File extension detected: '{file_extension}', allowed types: {settings.allowed_file_types}")
        
        # Handle case where there's no extension
        if not file_extension:
            raise ValueError("File must have an extension (.pdf, .docx, or .txt)")
        
        if file_extension not in settings.allowed_file_types:
            raise ValueError(f"Unsupported file type: {file_extension}. Allowed types: {', '.join(settings.allowed_file_types)}")
        
        print(f"File validation passed for: {clean_filename}")
        return True 