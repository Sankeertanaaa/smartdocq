import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import os
from app.core.config import settings

# Prevent transformers from importing TensorFlow / Keras (avoids tf-keras errors)
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TRANSFORMERS_NO_FLAX", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

class VectorStore:
    def __init__(self):
        import shutil
        import time
        
        # Check for corrupted database and delete it preemptively
        chroma_db_file = os.path.join(settings.CHROMA_PERSIST_DIRECTORY, "chroma.sqlite3")
        if os.path.exists(chroma_db_file):
            print(f"🔍 Found existing ChromaDB database at {chroma_db_file}")
            # Try to detect if it's corrupted by checking for the 'topic' column issue
            try:
                import sqlite3
                conn = sqlite3.connect(chroma_db_file)
                cursor = conn.cursor()
                # Try to query the collections table
                cursor.execute("SELECT * FROM collections LIMIT 1")
                conn.close()
                print("✅ ChromaDB database appears valid")
            except sqlite3.OperationalError as db_error:
                if "no such column" in str(db_error).lower() or "topic" in str(db_error).lower():
                    print(f"⚠️  Detected corrupted ChromaDB database: {str(db_error)}")
                    print("🔄 Deleting corrupted ChromaDB directory...")
                    try:
                        if os.path.exists(settings.CHROMA_PERSIST_DIRECTORY):
                            shutil.rmtree(settings.CHROMA_PERSIST_DIRECTORY)
                            print(f"✅ Deleted {settings.CHROMA_PERSIST_DIRECTORY}")
                        time.sleep(0.5)  # Brief pause
                        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
                        print("✅ Created fresh ChromaDB directory")
                    except Exception as cleanup_error:
                        print(f"❌ Failed to cleanup: {str(cleanup_error)}")
                else:
                    conn.close()
            except Exception as check_error:
                print(f"⚠️  Could not check database: {str(check_error)}")
        
        # Initialize ChromaDB with retry logic
        max_retries = 2
        for attempt in range(max_retries):
            try:
                print(f"🔧 Initializing ChromaDB (attempt {attempt + 1}/{max_retries})...")
                self.client = chromadb.PersistentClient(
                    path=settings.CHROMA_PERSIST_DIRECTORY,
                    settings=ChromaSettings(
                        anonymized_telemetry=False
                    )
                )
                
                self.collection = self.client.get_or_create_collection(
                    name="smartdoc_chunks",
                    metadata={"hnsw:space": "cosine"}
                )
                print("✅ ChromaDB initialized successfully")
                break  # Success, exit retry loop
                
            except Exception as e:
                error_msg = str(e).lower()
                print(f"❌ ChromaDB initialization error: {str(e)}")
                
                # Handle database schema errors by completely removing the database
                if ("no such column" in error_msg or "topic" in error_msg or 
                    "schema" in error_msg or "sqlite" in error_msg or "operational" in error_msg):
                    
                    if attempt < max_retries - 1:
                        print(f"🔄 Attempting to fix by deleting ChromaDB directory...")
                        try:
                            # Delete the entire ChromaDB directory
                            if os.path.exists(settings.CHROMA_PERSIST_DIRECTORY):
                                shutil.rmtree(settings.CHROMA_PERSIST_DIRECTORY)
                                print(f"✅ Deleted {settings.CHROMA_PERSIST_DIRECTORY}")
                            time.sleep(0.5)  # Brief pause
                            # Recreate the directory
                            os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
                            print("✅ ChromaDB directory reset, retrying...")
                            continue  # Retry initialization
                        except Exception as reset_error:
                            print(f"❌ Failed to reset ChromaDB directory: {str(reset_error)}")
                            if attempt == max_retries - 1:
                                raise
                    else:
                        print(f"❌ Failed after {max_retries} attempts")
                        raise
                else:
                    raise
        
        # Don't pre-load model to save memory - load on first use
        self._st_model = None
        print("💡 SentenceTransformer model will be loaded on first upload")
    
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
        """Add document chunks to vector store with batch processing"""
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
            
            # Process in batches to avoid memory issues and timeouts
            batch_size = 50  # Process 50 chunks at a time
            total_batches = (len(texts) + batch_size - 1) // batch_size
            
            print(f"Processing {len(texts)} texts in {total_batches} batches of {batch_size}")
            
            for batch_idx in range(0, len(texts), batch_size):
                batch_num = (batch_idx // batch_size) + 1
                batch_end = min(batch_idx + batch_size, len(texts))
                
                batch_ids = ids[batch_idx:batch_end]
                batch_texts = texts[batch_idx:batch_end]
                batch_metadatas = metadatas[batch_idx:batch_end]
                
                print(f"Batch {batch_num}/{total_batches}: Generating embeddings for {len(batch_texts)} texts")
                
                # Generate embeddings for this batch
                batch_embeddings = self._generate_embeddings(batch_texts)
                print(f"Batch {batch_num}/{total_batches}: Generated {len(batch_embeddings)} embeddings")
                
                # Add batch to ChromaDB
                print(f"Batch {batch_num}/{total_batches}: Adding to ChromaDB collection")
                self.collection.add(
                    ids=batch_ids,
                    embeddings=batch_embeddings,
                    documents=batch_texts,
                    metadatas=batch_metadatas
                )
                print(f"Batch {batch_num}/{total_batches}: Successfully added to ChromaDB")
            
            print(f"All {len(texts)} chunks successfully added to vector store")
            
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
        """Generate embeddings using local SentenceTransformer for better reliability"""
        # Use local sentence-transformers as primary method (384-dim, reliable)
        try:
            if self._st_model is None:
                # Fallback if pre-loading failed
                print("🔧 Loading SentenceTransformer model (fallback)...")
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ SentenceTransformer model loaded successfully")
            
            # Show progress for large batches
            if len(texts) > 10:
                print(f"🔄 Encoding {len(texts)} texts...")
            
            matrix = self._st_model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            
            if len(texts) > 10:
                print(f"✅ Encoded {len(texts)} texts successfully")
            
            return [vec.tolist() for vec in matrix]
        except Exception as e:
            print(f"❌ Error with SentenceTransformer: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Final fallback: zeros matching current collection dimension
            print("⚠️ Falling back to zero embeddings (not recommended for production)")
            # Check collection dimension first
            try:
                # Try a test query to determine expected dimension
                test_results = self.collection.query(
                    query_embeddings=[[0.0] * 384],  # Try 384 first
                    n_results=1
                )
                print("Using 384-dimensional zero embeddings")
                return [[0.0] * 384 for _ in texts]
            except:
                try:
                    test_results = self.collection.query(
                        query_embeddings=[[0.0] * 768],  # Try 768
                        n_results=1
                    )
                    print("Using 768-dimensional zero embeddings")
                    return [[0.0] * 768 for _ in texts]
                except:
                    # Default to 384 for new collections
                    print("Using default 384-dimensional zero embeddings")
                    return [[0.0] * 384 for _ in texts]
    
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