"""
Add user_id to existing document chunks in ChromaDB
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
import os

CHROMA_PERSIST_DIRECTORY = "./chroma_db"
ADMIN_USER_ID = "68edd25c08f20b54baace9d6"

def fix_document_user_ids():
    print("=" * 60)
    print("FIXING DOCUMENT USER IDs IN CHROMADB")
    print("=" * 60)
    
    # Connect to ChromaDB
    client = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIRECTORY,
        settings=ChromaSettings(anonymized_telemetry=False)
    )
    
    try:
        collection = client.get_collection("smartdoc_chunks")
    except Exception as e:
        print(f"❌ Error getting collection: {e}")
        return
    
    print(f"\n📊 Collection: smartdoc_chunks")
    print(f"   Total chunks: {collection.count()}")
    
    # Get all chunks
    print("\n🔍 Fetching all chunks...")
    results = collection.get(include=["metadatas", "documents"])
    
    total_chunks = len(results["ids"])
    chunks_without_user_id = 0
    chunks_with_user_id = 0
    
    print(f"   Retrieved {total_chunks} chunks")
    
    # Check which chunks need user_id
    chunks_to_update = []
    for i, chunk_id in enumerate(results["ids"]):
        metadata = results["metadatas"][i]
        
        if "user_id" not in metadata or not metadata.get("user_id"):
            chunks_without_user_id += 1
            chunks_to_update.append({
                "id": chunk_id,
                "metadata": metadata
            })
        else:
            chunks_with_user_id += 1
    
    print(f"\n📈 Statistics:")
    print(f"   Chunks with user_id: {chunks_with_user_id}")
    print(f"   Chunks without user_id: {chunks_without_user_id}")
    
    if chunks_without_user_id == 0:
        print("\n✅ All chunks already have user_id!")
        return
    
    print(f"\n🔧 Updating {chunks_without_user_id} chunks...")
    print(f"   Setting user_id to admin: {ADMIN_USER_ID}")
    
    # Update chunks in batches
    batch_size = 100
    updated_count = 0
    
    for i in range(0, len(chunks_to_update), batch_size):
        batch = chunks_to_update[i:i+batch_size]
        
        ids = [chunk["id"] for chunk in batch]
        metadatas = []
        
        for chunk in batch:
            # Add user_id to metadata
            updated_metadata = chunk["metadata"].copy()
            updated_metadata["user_id"] = ADMIN_USER_ID
            metadatas.append(updated_metadata)
        
        try:
            # Update in ChromaDB
            collection.update(
                ids=ids,
                metadatas=metadatas
            )
            updated_count += len(batch)
            print(f"   Updated {updated_count}/{chunks_without_user_id} chunks...")
        except Exception as e:
            print(f"   ❌ Error updating batch: {e}")
    
    print(f"\n✅ Successfully updated {updated_count} chunks!")
    
    # Verify
    print("\n🔍 Verifying updates...")
    results_after = collection.get(include=["metadatas"])
    
    verified_count = 0
    for metadata in results_after["metadatas"]:
        if metadata.get("user_id") == ADMIN_USER_ID:
            verified_count += 1
    
    print(f"   Chunks with admin user_id: {verified_count}")
    
    # Show sample documents
    print("\n📋 Sample documents:")
    all_results = collection.get(include=["metadatas"])
    document_ids = set()
    
    for metadata in all_results["metadatas"]:
        if "document_id" in metadata:
            document_ids.add(metadata["document_id"])
    
    print(f"   Total unique documents: {len(document_ids)}")
    for i, doc_id in enumerate(list(document_ids)[:5], 1):
        # Get chunks for this document
        doc_results = collection.get(
            where={"document_id": doc_id},
            include=["metadatas"]
        )
        chunk_count = len(doc_results["ids"])
        first_metadata = doc_results["metadatas"][0] if doc_results["metadatas"] else {}
        filename = first_metadata.get("filename", "Unknown")
        user_id = first_metadata.get("user_id", "None")
        
        print(f"   {i}. {filename}")
        print(f"      Document ID: {doc_id[:30]}...")
        print(f"      Chunks: {chunk_count}")
        print(f"      User ID: {user_id}")
    
    print("\n✅ Done! All documents now have user_id.")
    print("\n📝 NEXT STEPS:")
    print("   1. Refresh the Document Library page")
    print("   2. Documents should now appear for the admin user")
    print("   3. Other users won't see these documents (they belong to admin)")

if __name__ == "__main__":
    fix_document_user_ids()
