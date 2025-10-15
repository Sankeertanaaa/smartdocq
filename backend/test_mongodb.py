#!/usr/bin/env python3
"""
Test script for MongoDB integration
Run this script to verify that MongoDB is working correctly
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.database import connect_to_mongo, close_mongo_connection, get_users_collection, get_sessions_collection, get_messages_collection, get_feedback_collection
from app.models.mongodb_models import UserModel, SessionModel, MessageModel, FeedbackModel
from datetime import datetime

async def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    print("🔧 Testing MongoDB integration...")
    
    try:
        # Connect to MongoDB
        await connect_to_mongo()
        print("✅ Successfully connected to MongoDB")
        
        # Test user operations
        print("\n📝 Testing user operations...")
        users_collection = get_users_collection()
        
        # Create a test user
        test_user = UserModel(
            full_name="Test User",
            email="test@example.com",
            hashed_password="hashed_password_here",
            role="student",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Insert test user
        result = await users_collection.insert_one(test_user.dict(by_alias=True))
        print(f"✅ Created test user with ID: {result.inserted_id}")
        
        # Find the test user
        found_user = await users_collection.find_one({"email": "test@example.com"})
        if found_user:
            print(f"✅ Found test user: {found_user['full_name']}")
        else:
            print("❌ Failed to find test user")
        
        # Test session operations
        print("\n📝 Testing session operations...")
        sessions_collection = get_sessions_collection()
        
        test_session = SessionModel(
            session_id="test_session_123",
            user_id=str(result.inserted_id),
            title="Test Session",
            is_guest=False,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            message_count=0
        )
        
        session_result = await sessions_collection.insert_one(test_session.dict(by_alias=True))
        print(f"✅ Created test session with ID: {session_result.inserted_id}")
        
        # Test message operations
        print("\n📝 Testing message operations...")
        messages_collection = get_messages_collection()
        
        test_message = MessageModel(
            session_id="test_session_123",
            user_id=str(result.inserted_id),
            message_type="user",
            content="Hello, this is a test message!",
            timestamp=datetime.utcnow()
        )
        
        message_result = await messages_collection.insert_one(test_message.dict(by_alias=True))
        print(f"✅ Created test message with ID: {message_result.inserted_id}")
        
        # Test feedback operations
        print("\n📝 Testing feedback operations...")
        feedback_collection = get_feedback_collection()
        
        test_feedback = FeedbackModel(
            session_id="test_session_123",
            user_id=str(result.inserted_id),
            message_id=str(message_result.inserted_id),
            rating=5,
            comment="Great response!",
            timestamp=datetime.utcnow()
        )
        
        feedback_result = await feedback_collection.insert_one(test_feedback.dict(by_alias=True))
        print(f"✅ Created test feedback with ID: {feedback_result.inserted_id}")
        
        # Test queries
        print("\n📊 Testing queries...")
        
        # Count documents
        user_count = await users_collection.count_documents({})
        session_count = await sessions_collection.count_documents({})
        message_count = await messages_collection.count_documents({})
        feedback_count = await feedback_collection.count_documents({})
        
        print(f"📈 Database statistics:")
        print(f"   - Users: {user_count}")
        print(f"   - Sessions: {session_count}")
        print(f"   - Messages: {message_count}")
        print(f"   - Feedback: {feedback_count}")
        
        # Clean up test data
        print("\n🧹 Cleaning up test data...")
        await users_collection.delete_one({"_id": result.inserted_id})
        await sessions_collection.delete_one({"_id": session_result.inserted_id})
        await messages_collection.delete_one({"_id": message_result.inserted_id})
        await feedback_collection.delete_one({"_id": feedback_result.inserted_id})
        print("✅ Test data cleaned up")
        
        print("\n🎉 All MongoDB tests passed successfully!")
        
    except Exception as e:
        print(f"❌ MongoDB test failed: {str(e)}")
        return False
    
    finally:
        # Close connection
        await close_mongo_connection()
        print("🔌 MongoDB connection closed")
    
    return True

async def main():
    """Main test function"""
    print("🚀 Starting MongoDB integration tests...\n")
    
    success = await test_mongodb_connection()
    
    if success:
        print("\n✅ All tests completed successfully!")
        print("🎯 MongoDB integration is working correctly!")
        print("\n📋 Next steps:")
        print("   1. Make sure MongoDB is running on your system")
        print("   2. Update your .env file with MongoDB connection details")
        print("   3. Start your FastAPI application")
        print("   4. Test the API endpoints")
    else:
        print("\n❌ Tests failed!")
        print("🔧 Please check your MongoDB setup and try again")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
