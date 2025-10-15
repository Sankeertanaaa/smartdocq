"""
Reassign documents from one user to another
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
import sys

CHROMA_PERSIST_DIRECTORY = "./chroma_db"

def reassign_documents(from_user_id: str, to_user_id: str, document_ids: list = None):
    """
    Reassign documents from one user to another
    If document_ids is None, reassign ALL documents from from_user_id to to_user_id
    """
    print("=" * 60)
    print("REASSIGNING DOCUMENTS")
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
    print(f"\n🔄 Reassigning documents:")
    print(f"   From user: {from_user_id}")
    print(f"   To user:   {to_user_id}")
    
    # Get all chunks
    results = collection.get(include=["metadatas"])
    
    # Find chunks to reassign
    chunks_to_update = []
    affected_documents = set()
    
    for i, chunk_id in enumerate(results["ids"]):
        metadata = results["metadatas"][i]
        chunk_user_id = metadata.get("user_id")
        doc_id = metadata.get("document_id")
        
        # Check if this chunk should be reassigned
        should_reassign = False
        
        if document_ids:
            # Reassign only specific documents
            if doc_id in document_ids and chunk_user_id == from_user_id:
                should_reassign = True
        else:
            # Reassign all documents from from_user_id
            if chunk_user_id == from_user_id:
                should_reassign = True
        
        if should_reassign:
            chunks_to_update.append({
                "id": chunk_id,
                "metadata": metadata,
                "document_id": doc_id
            })
            affected_documents.add(doc_id)
    
    print(f"\n📈 Statistics:")
    print(f"   Chunks to reassign: {len(chunks_to_update)}")
    print(f"   Documents affected: {len(affected_documents)}")
    
    if len(chunks_to_update) == 0:
        print("\n⚠️  No chunks to reassign!")
        return
    
    # Show affected documents
    print(f"\n📋 Documents to be reassigned:")
    for i, doc_id in enumerate(list(affected_documents)[:10], 1):
        # Get first chunk of this document to show filename
        doc_chunks = [c for c in chunks_to_update if c["document_id"] == doc_id]
        if doc_chunks:
            filename = doc_chunks[0]["metadata"].get("filename", "Unknown")
            chunk_count = len(doc_chunks)
            print(f"   {i}. {filename}")
            print(f"      Document ID: {doc_id[:30]}...")
            print(f"      Chunks: {chunk_count}")
    
    # Confirm
    print(f"\n⚠️  This will reassign {len(affected_documents)} documents to user {to_user_id}")
    response = input("Continue? (yes/no): ")
    
    if response.lower() != "yes":
        print("❌ Cancelled")
        return
    
    # Update chunks
    print(f"\n🔧 Updating {len(chunks_to_update)} chunks...")
    batch_size = 100
    updated_count = 0
    
    for i in range(0, len(chunks_to_update), batch_size):
        batch = chunks_to_update[i:i+batch_size]
        
        ids = [chunk["id"] for chunk in batch]
        metadatas = []
        
        for chunk in batch:
            # Update user_id in metadata
            updated_metadata = chunk["metadata"].copy()
            updated_metadata["user_id"] = to_user_id
            metadatas.append(updated_metadata)
        
        try:
            collection.update(
                ids=ids,
                metadatas=metadatas
            )
            updated_count += len(batch)
            print(f"   Updated {updated_count}/{len(chunks_to_update)} chunks...")
        except Exception as e:
            print(f"   ❌ Error updating batch: {e}")
    
    print(f"\n✅ Successfully reassigned {len(affected_documents)} documents!")
    print(f"   Total chunks updated: {updated_count}")
    
    print("\n📝 NEXT STEPS:")
    print(f"   1. Log in as user {to_user_id}")
    print("   2. Refresh the Document Library page")
    print(f"   3. You should now see {len(affected_documents)} documents")

if __name__ == "__main__":
    # User IDs
    ADMIN_ID = "68edd25c08f20b54baace9d6"
    S123_ID = "68edd55f08f20b54baace9d7"
    
    print("\n🔧 Document Reassignment Tool")
    print("\nAvailable users:")
    print(f"1. Admin (ID: {ADMIN_ID})")
    print(f"2. s123@gmail.com (ID: {S123_ID})")
    
    print("\nOptions:")
    print("1. Reassign ALL admin documents to s123")
    print("2. Reassign specific documents")
    print("3. Cancel")
    
    choice = input("\nEnter choice (1-3): ")
    
    if choice == "1":
        reassign_documents(ADMIN_ID, S123_ID)
    elif choice == "2":
        print("\nEnter document IDs to reassign (comma-separated):")
        doc_ids_str = input("> ")
        doc_ids = [d.strip() for d in doc_ids_str.split(",")]
        reassign_documents(ADMIN_ID, S123_ID, doc_ids)
    else:
        print("❌ Cancelled")
