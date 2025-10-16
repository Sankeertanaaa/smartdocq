import motor.motor_asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    database: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db.database = db.client[settings.MONGODB_DATABASE]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {e}")
        logger.warning("⚠️  App will continue without MongoDB (some features may not work)")
        # Don't raise - allow app to start without MongoDB
        db.client = None
        db.database = None

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("created_at")
        
        # Sessions collection indexes
        await db.database.sessions.create_index("user_id")
        await db.database.sessions.create_index("created_at")
        await db.database.sessions.create_index("last_activity")
        
        # Messages collection indexes
        await db.database.messages.create_index("session_id")
        await db.database.messages.create_index("user_id")
        await db.database.messages.create_index("timestamp")
        await db.database.messages.create_index([("session_id", 1), ("timestamp", 1)])
        
        # Feedback collection indexes
        await db.database.feedback.create_index("session_id")
        await db.database.feedback.create_index("user_id")
        await db.database.feedback.create_index("timestamp")
        
        # Documents collection indexes
        await db.database.documents.create_index("user_id")
        await db.database.documents.create_index("filename")
        await db.database.documents.create_index("uploaded_at")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")

# Collection getters
def get_users_collection():
    if db.database is None:
        return None
    return db.database.users

def get_sessions_collection():
    if db.database is None:
        return None
    return db.database.sessions

def get_messages_collection():
    if db.database is None:
        return None
    return db.database.messages

def get_feedback_collection():
    if db.database is None:
        return None
    return db.database.feedback

def get_documents_collection():
    if db.database is None:
        return None
    return db.database.documents
