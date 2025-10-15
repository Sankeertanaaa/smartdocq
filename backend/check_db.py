import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def check_database():
    """Check what's in the database"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["smartdocq"]
    
    print("=" * 60)
    print("📊 DATABASE STATUS CHECK")
    print("=" * 60)
    
    # Check users
    users_collection = db["users"]
    users = await users_collection.find().to_list(length=100)
    print(f"\n👥 USERS: {len(users)} total")
    for user in users:
        print(f"   - {user.get('email')} ({user.get('role')}) - ID: {str(user['_id'])}")
    
    # Check sessions
    sessions_collection = db["sessions"]
    sessions = await sessions_collection.find().to_list(length=100)
    print(f"\n💬 CHAT SESSIONS: {len(sessions)} total")
    for session in sessions:
        title = session.get('title', 'Untitled')
        user_id = session.get('user_id', 'No user')
        created = session.get('created_at', 'Unknown')
        print(f"   - {title} (User: {user_id}) - Created: {created}")
    
    # Check history
    history_collection = db["history"]
    history = await history_collection.find().to_list(length=100)
    print(f"\n📜 HISTORY ENTRIES: {len(history)} total")
    
    # Check documents
    documents_collection = db["documents"]
    documents = await documents_collection.find().to_list(length=100)
    print(f"\n📄 DOCUMENTS: {len(documents)} total")
    for doc in documents:
        filename = doc.get('filename', 'Unknown')
        user_id = doc.get('user_id', 'No user')
        print(f"   - {filename} (User: {user_id})")
    
    print("\n" + "=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_database())
