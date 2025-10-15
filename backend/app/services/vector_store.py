import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import os
from app.core.config import settings
import google.generativeai as genai

# Prevent transformers from importing TensorFlow / Keras (avoids tf-keras errors)
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TRANSFORMERS_NO_FLAX", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

class VectorStore:
    def __init__(self):
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(
                anonymized_telemetry=False
            )
        )
        
        # Get or create collection with error handling for schema issues
        try:
            self.collection = self.client.get_or_create_collection(
                name="smartdoc_chunks",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            error_msg = str(e).lower()
            # Handle database schema errors by deleting and recreating
            if "no such column" in error_msg or "topic" in error_msg or "schema" in error_msg:
                print(f"⚠️  ChromaDB schema error detected: {str(e)}")
                print("🔄 Resetting ChromaDB to fix schema...")
                try:
                    # Try to delete the old collection
                    try:
                        self.client.delete_collection("smartdoc_chunks")
                    except:
                        pass
                    # Recreate collection
                    self.collection = self.client.create_collection(
                        name="smartdoc_chunks",
                        metadata={"hnsw:space": "cosine"}
                    )
                    print("✅ ChromaDB reset successful")
                except Exception as reset_error:
                    print(f"❌ Failed to reset ChromaDB: {str(reset_error)}")
                    raise
            else:
                raise
        
        # Initialize Gemini for embeddings
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self._st_model = None
    
    def _reset_collection(self):
        try:
            self.client.delete_collection("smartdoc_chunks")
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name="smartdoc_chunks",
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(self, chunks: List[Dict[str, Any]]) -> bool:
        """Add document chunks to vector store"""
        print(f"Adding {len(chunks)} chunks to vector store")
        
        def _add():
            # Prepare data for ChromaDB
            ids = []
            texts = []
            metadatas = []
            
            for chunk in chunks:
                ids.append(chunk["id"])
                texts.append(chunk["text"])
                # Only include basic metadata to avoid ChromaDB issues
                metadata = {
                    "document_id": chunk["document_id"],
                    "chunk_index": chunk["chunk_index"],
                    "filename": chunk["filename"]
                }
                # Add user_id if present
                if "user_id" in chunk and chunk["user_id"]:
                    metadata["user_id"] = chunk["user_id"]
                metadatas.append(metadata)
            
            print(f"Generating embeddings for {len(texts)} texts")
            # Generate embeddings
            embeddings = self._generate_embeddings(texts)
            print(f"Generated {len(embeddings)} embeddings")
            
            # Add to ChromaDB
            print("Adding to ChromaDB collection")
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas
            )
            print("Successfully added to ChromaDB")
            
        try:
            _add()
            return True
        except Exception as e:
            msg = str(e).lower()
            print(f"Error adding documents to vector store: {str(e)}")
            # Handle collection errors by resetting the collection once
            if ("dimension" in msg or "shape" in msg or "embeddings" in msg and "mismatch" in msg or 
                "does not exist" in msg or "not exist" in msg or "collection" in msg):
                print("Resetting Chroma collection and retrying...")
                self._reset_collection()
                try:
                    _add()
                    return True
                except Exception as e2:
                    print(f"Retry after reset failed: {str(e2)}")
            return False
    
    def search_similar(self, query: str, n_results: int = 5, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar chunks based on query"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embeddings([query])[0]
            
            # Prepare where clause if document_id is specified
            where_clause = None
            if document_id:
                where_clause = {"document_id": document_id}
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted_results.append({
                        "text": doc,
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i]
                    })
            
            return formatted_results
            
        except Exception as e:
            msg = str(e).lower()
            print(f"Error searching vector store: {str(e)}")
            if ("does not exists" in msg or "not exist" in msg or "missing" in msg or 
                "dimension" in msg or "embedding" in msg):
                # Recreate collection if it was deleted/corrupted or has dimension mismatch
                print("Resetting collection due to dimension mismatch or missing collection")
                try:
                    self._reset_collection()
                    # Retry the search after reset
                    query_embedding = self._generate_embeddings([query])[0]
                    where_clause = None
                    if document_id:
                        where_clause = {"document_id": document_id}
                    
                    results = self.collection.query(
                        query_embeddings=[query_embedding],
                        n_results=n_results,
                        where=where_clause,
                        include=["documents", "metadatas", "distances"]
                    )
                    
                    formatted_results = []
                    if results["documents"] and results["documents"][0]:
                        for i, doc in enumerate(results["documents"][0]):
                            formatted_results.append({
                                "text": doc,
                                "metadata": results["metadatas"][0][i],
                                "distance": results["distances"][0][i]
                            })
                    
                    return formatted_results
                except Exception as e2:
                    print(f"Retry after reset failed: {str(e2)}")
            return []
    
    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a specific document"""
        try:
            self.collection.delete(
                where={"document_id": document_id}
            )
            return True
        except Exception as e:
            print(f"Error deleting document from vector store: {str(e)}")
            return False
    
    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a specific document"""
        try:
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )
            
            chunks = []
            for i, doc in enumerate(results["documents"]):
                chunks.append({
                    "text": doc,
                    "metadata": results["metadatas"][i]
                })
            
            return chunks
            
        except Exception as e:
            print(f"Error getting document chunks: {str(e)}")
            return []
    
    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Gemini for better semantic matching"""
        # Use Gemini embeddings for superior semantic understanding
        try:
            embeddings: List[List[float]] = []
            for text in texts:
                truncated_text = text[:10000] if len(text) > 10000 else text
                # Use Gemini embeddings (768-dim, better semantic understanding)
                resp = genai.embed_content(model="models/text-embedding-004", content=truncated_text)
                # google-generativeai returns { 'embedding': [..] } or nested under 'data' in older versions
                vec = None
                if isinstance(resp, dict) and 'embedding' in resp:
                    vec = resp['embedding']
                elif hasattr(resp, 'embedding'):
                    vec = resp.embedding
                else:
                    # Unexpected shape
                    raise RuntimeError("Unexpected embedding response shape")
                embeddings.append(vec)
            return embeddings
        except Exception as e:
            print(f"Error generating embeddings via Gemini, falling back to SentenceTransformer: {str(e)}")
            # Fallback to local sentence-transformers (384-dim)
            try:
                if self._st_model is None:
                    # Lazy import to avoid global TF/Keras import side effects
                    from sentence_transformers import SentenceTransformer
                    self._st_model = SentenceTransformer('all-MiniLM-L6-v2')
                matrix = self._st_model.encode(texts, normalize_embeddings=True)
                return [vec.tolist() for vec in matrix]
            except Exception as e2:
                print(f"Error with SentenceTransformer fallback: {str(e2)}")
                # Final fallback: zeros matching current collection dimension
                # Check collection dimension first
                try:
                    # Try a test query to determine expected dimension
                    test_results = self.collection.query(
                        query_embeddings=[[0.0] * 384],  # Try 384 first
                        n_results=1
                    )
                    return [[0.0] * 384 for _ in texts]
                except:
                    try:
                        test_results = self.collection.query(
                            query_embeddings=[[0.0] * 768],  # Try 768
                            n_results=1
                        )
                        return [[0.0] * 768 for _ in texts]
                    except:
                        # Default to 768 for new collections
                        return [[0.0] * 768 for _ in texts]
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        try:
            count = self.collection.count()
            return {
                "total_chunks": count,
                "collection_name": self.collection.name
            }
        except Exception as e:
            print(f"Error getting collection stats: {str(e)}")
            return {"total_chunks": 0, "collection_name": "unknown"} 

    def list_documents(self) -> List[Dict[str, Any]]:
        """List distinct documents with chunk counts and filenames."""
        try:
            results = self.collection.get(include=["metadatas"])  # may be large for big datasets
            doc_map: Dict[str, Dict[str, Any]] = {}
            for md in results.get("metadatas", []):
                document_id = md.get("document_id")
                filename = md.get("filename", "")
                if not document_id:
                    continue
                if document_id not in doc_map:
                    doc_map[document_id] = {"document_id": document_id, "filename": filename, "chunk_count": 0}
                doc_map[document_id]["chunk_count"] += 1
            return list(doc_map.values())
        except Exception as e:
            print(f"Error listing documents: {str(e)}")
            return []