"""
Fix sessions and documents to have user_id
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DATABASE = "smartdocq"

async def fix_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DATABASE]
    sessions_collection = db.sessions
    messages_collection = db.messages
    
    print("=" * 60)
    print("FIXING SESSIONS AND MESSAGES")
    print("=" * 60)
    
    # Check sessions
    print("\n📋 Checking sessions...")
    all_sessions = await sessions_collection.find({}).to_list(length=1000)
    print(f"   Total sessions: {len(all_sessions)}")
    
    sessions_without_user_id = 0
    for session in all_sessions:
        if not session.get('user_id'):
            sessions_without_user_id += 1
            print(f"   - Session {session.get('session_id', 'unknown')} has no user_id")
    
    print(f"\n   Sessions without user_id: {sessions_without_user_id}")
    
    if sessions_without_user_id > 0:
        print("\n🔧 Fixing sessions without user_id...")
        print("   Setting user_id to admin (68edd25c08f20b54baace9d6)")
        
        result = await sessions_collection.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": "68edd25c08f20b54baace9d6"}}
        )
        print(f"   ✅ Updated {result.modified_count} sessions")
        
        result = await sessions_collection.update_many(
            {"user_id": None},
            {"$set": {"user_id": "68edd25c08f20b54baace9d6"}}
        )
        print(f"   ✅ Updated {result.modified_count} sessions with null user_id")
    
    # Check messages
    print("\n📋 Checking messages...")
    all_messages = await messages_collection.find({}).to_list(length=10000)
    print(f"   Total messages: {len(all_messages)}")
    
    messages_without_user_id = 0
    for message in all_messages:
        if not message.get('user_id'):
            messages_without_user_id += 1
    
    print(f"   Messages without user_id: {messages_without_user_id}")
    
    if messages_without_user_id > 0:
        print("\n🔧 Fixing messages without user_id...")
        print("   Setting user_id to admin (68edd25c08f20b54baace9d6)")
        
        result = await messages_collection.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": "68edd25c08f20b54baace9d6"}}
        )
        print(f"   ✅ Updated {result.modified_count} messages")
        
        result = await messages_collection.update_many(
            {"user_id": None},
            {"$set": {"user_id": "68edd25c08f20b54baace9d6"}}
        )
        print(f"   ✅ Updated {result.modified_count} messages with null user_id")
    
    # Show final state
    print("\n" + "=" * 60)
    print("FINAL STATE")
    print("=" * 60)
    
    # Sessions by user
    print("\n📊 Sessions by user:")
    pipeline = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    user_sessions = await sessions_collection.aggregate(pipeline).to_list(length=100)
    for item in user_sessions:
        user_id = item['_id']
        count = item['count']
        print(f"   User {user_id}: {count} sessions")
    
    # Messages by user
    print("\n📊 Messages by user:")
    pipeline = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    user_messages = await messages_collection.aggregate(pipeline).to_list(length=100)
    for item in user_messages:
        user_id = item['_id']
        count = item['count']
        print(f"   User {user_id}: {count} messages")
    
    # List some sessions
    print("\n📋 Sample sessions:")
    sample_sessions = await sessions_collection.find({}).limit(5).to_list(length=5)
    for session in sample_sessions:
        print(f"   - {session.get('session_id', 'unknown')[:20]}... (user: {session.get('user_id', 'none')}, messages: {session.get('message_count', 0)})")
    
    print("\n✅ Done! Refresh the History page in your browser.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_data())
