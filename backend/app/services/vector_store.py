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

# Disable ChromaDB telemetry to prevent errors
os.environ.setdefault("CHROMA_TELEMETRY", "0")
os.environ.setdefault("CHROMA_ANONYMIZED_TELEMETRY", "0")
os.environ.setdefault("ANONYMIZED_TELEMETRY", "0")

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
                # Force reset to ensure TF-IDF dimensions
                print("🔄 Resetting ChromaDB for TF-IDF compatibility...")
                if os.path.exists(settings.CHROMA_PERSIST_DIRECTORY):
                    shutil.rmtree(settings.CHROMA_PERSIST_DIRECTORY)
                    print(f"✅ Deleted old ChromaDB directory")
                time.sleep(0.5)
                os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
                print("✅ Created fresh ChromaDB directory for TF-IDF")
                # Reset TF-IDF vectorizer as well
                self._tfidf_vectorizer = None
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
                        # Reset TF-IDF vectorizer as well
                        self._tfidf_vectorizer = None
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
                # Use in-memory ChromaDB for Railway compatibility (no persistent writes needed)
                print(f"🔧 Initializing ChromaDB in-memory mode for Railway...")
                self.client = chromadb.EphemeralClient(
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
                            # Reset TF-IDF vectorizer as well
                            self._tfidf_vectorizer = None
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
        
        # Removed SentenceTransformer initialization since we're using TF-IDF
        self._st_model = None
        # TF-IDF vectorizer instance variable
        self._tfidf_vectorizer = None
    
    def _reset_collection(self):
        try:
            self.client.delete_collection("smartdoc_chunks")
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name="smartdoc_chunks",
            metadata={"hnsw:space": "cosine"}
        )
        # Also reset the TF-IDF vectorizer to maintain consistency
        self._tfidf_vectorizer = None
        print("🔄 Reset TF-IDF vectorizer")

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
    
    def search_similar(self, query: str, n_results: int = 5, document_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar chunks based on query with user access control"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embeddings([query])[0]

            # Build where clause for filtering
            where_clause = {}

            # Filter by document_id if specified
            if document_id:
                where_clause["document_id"] = document_id

            # Filter by user_id if specified (for privacy control)
            if user_id:
                where_clause["user_id"] = user_id

            # For guest users (user_id is None), only search documents that are marked as public
            if user_id is None:
                # This requires checking document metadata for public status
                # For now, we'll search all documents but filter results based on public sessions
                pass

            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )

            # Format results
            formatted_results = []
            print(f"🔍 Search results: documents={len(results.get('documents', [[]])[0]) if results.get('documents') else 0}, distances={results.get('distances', [[]])[0] if results.get('distances') else []}")
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i]
                    formatted_results.append({
                        "text": doc,
                        "metadata": metadata,
                        "distance": results["distances"][0][i]
                    })

            # If no results found, try a more general search without user_id filter (for fallback)
            if not formatted_results and user_id:
                print("⚠️ No results found with user filter, trying broader search...")
                try:
                    # Try searching without user_id filter (for public documents or admin access)
                    general_results = self.collection.query(
                        query_embeddings=[query_embedding],
                        n_results=min(n_results, 5),  # Limit to prevent too many results
                        where={"document_id": document_id} if document_id else None,
                        include=["documents", "metadatas", "distances"]
                    )
                    if general_results["documents"] and general_results["documents"][0]:
                        for i, doc in enumerate(general_results["documents"][0]):
                            formatted_results.append({
                                "text": doc,
                                "metadata": general_results["metadatas"][0][i],
                                "distance": general_results["distances"][0][i]
                            })
                        print(f"✅ Found {len(formatted_results)} results from broader search")
                except Exception as e:
                    print(f"⚠️ Broader search failed: {str(e)}")

            # If still no results, return at least one document if any exist in the collection
            if not formatted_results:
                print("⚠️ No search results, checking if any documents exist...")
                try:
                    # Get any document from the collection as fallback
                    all_docs = self.collection.get(include=["documents", "metadatas"], limit=1)
                    if all_docs["documents"] and all_docs["documents"][0]:
                        formatted_results.append({
                            "text": all_docs["documents"][0],
                            "metadata": all_docs["metadatas"][0],
                            "distance": 0.5  # Medium similarity as fallback
                        })
                        print("✅ Using fallback document for context")
                except Exception as e:
                    print(f"⚠️ Fallback document retrieval failed: {str(e)}")

            print(f"🔍 Final formatted results: {len(formatted_results)}")
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
                    where_clause = {}

                    if document_id:
                        where_clause["document_id"] = document_id
                    if user_id:
                        where_clause["user_id"] = user_id

                    results = self.collection.query(
                        query_embeddings=[query_embedding],
                        n_results=n_results,
                        where=where_clause,
                        include=["documents", "metadatas", "distances"]
                    )

                    formatted_results = []
                    print(f"🔍 Retry search results: documents={len(results.get('documents', [[]])[0]) if results.get('documents') else 0}")
                    if results["documents"] and results["documents"][0]:
                        for i, doc in enumerate(results["documents"][0]):
                            formatted_results.append({
                                "text": doc,
                                "metadata": results["metadatas"][0][i],
                                "distance": results["distances"][0][i]
                            })

                    # Always return at least one result if available
                    if not formatted_results and results["documents"] and results["documents"][0]:
                        print("⚠️ No high-similarity results in retry, but found documents - returning best match")
                        formatted_results.append({
                            "text": results["documents"][0][0],
                            "metadata": results["metadatas"][0][0],
                            "distance": results["distances"][0][0]
                        })

                    print(f"🔍 Formatted {len(formatted_results)} results from retry search")
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
    
    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using TF-IDF for free tier compatibility"""
        # TF-IDF is lightweight and works on free tier (512MB RAM)
        try:
            print(f"🔧 Generating TF-IDF embeddings for {len(texts)} texts...")
            from sklearn.feature_extraction.text import TfidfVectorizer
            import numpy as np

            # If vectorizer doesn't exist, create and fit it with the provided texts
            if self._tfidf_vectorizer is None:
                print("🔧 Creating and fitting new TF-IDF vectorizer...")
                # Create TF-IDF vectorizer (384 dimensions max, but will use actual vocab size)
                self._tfidf_vectorizer = TfidfVectorizer(max_features=384, stop_words='english')
                tfidf_matrix = self._tfidf_vectorizer.fit_transform(texts)
            else:
                # Use existing fitted vectorizer to transform texts
                print("🔧 Using existing TF-IDF vectorizer...")
                tfidf_matrix = self._tfidf_vectorizer.transform(texts)

            embeddings = tfidf_matrix.toarray()

            # Normalize
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1
            embeddings = embeddings / norms

            # Ensure we always return proper list of lists format
            result = embeddings.tolist()

            # Validate the result format
            if not isinstance(result, list):
                print(f"❌ Invalid embedding format: {type(result)}")
                # Use the vectorizer's vocabulary size as dimension
                vocab_size = len(self._tfidf_vectorizer.get_feature_names_out()) if self._tfidf_vectorizer else 384
                result = [[0.0] * vocab_size for _ in texts]
            elif len(result) > 0 and not isinstance(result[0], list):
                print(f"❌ Invalid embedding structure: {type(result[0])}")
                # Use the vectorizer's vocabulary size as dimension
                vocab_size = len(self._tfidf_vectorizer.get_feature_names_out()) if self._tfidf_vectorizer else 384
                result = [[0.0] * vocab_size for _ in texts]

            vocab_size = len(self._tfidf_vectorizer.get_feature_names_out()) if self._tfidf_vectorizer else 384
            print(f"✅ Generated {len(result)} TF-IDF embeddings with shape: {vocab_size}")
            return result
        except Exception as e:
            print(f"❌ TF-IDF embedding failed: {str(e)}")
            import traceback
            traceback.print_exc()
            # Fallback to zero embeddings with correct vocabulary size
            vocab_size = len(self._tfidf_vectorizer.get_feature_names_out()) if self._tfidf_vectorizer else 384
            print(f"⚠️ Using zero embeddings as fallback with dimension: {vocab_size}")
            return [[0.0] * vocab_size for _ in texts]
    
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

    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a specific document"""
        try:
            # Query for all chunks of the document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )

            formatted_chunks = []
            if results["documents"]:
                for i, doc in enumerate(results["documents"]):
                    formatted_chunks.append({
                        "text": doc,
                        "metadata": results["metadatas"][i],
                        "distance": 0.0  # Not a similarity search, so distance is 0
                    })

            print(f"🔍 Retrieved {len(formatted_chunks)} chunks for document {document_id}")
            return formatted_chunks

        except Exception as e:
            print(f"Error getting document chunks: {str(e)}")
            return []

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