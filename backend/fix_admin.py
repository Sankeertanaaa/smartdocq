"""
Script to check and recreate the admin user if needed
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt
from datetime import datetime
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def fix_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DATABASE]
    users_collection = db.users
    
    print("🔍 Checking admin user...")
    
    # Check if admin exists
    admin = await users_collection.find_one({"email": "admin@smartdoc.com"})
    
    if admin:
        print(f"✅ Admin user found!")
        print(f"   ID: {admin['_id']}")
        print(f"   Email: {admin.get('email')}")
        print(f"   Full Name: {admin.get('full_name')}")
        print(f"   Role: {admin.get('role')}")
        print(f"   Active: {admin.get('is_active')}")
        
        # Update password to ensure it's correct
        print("\n🔧 Updating admin password to 'admin123'...")
        await users_collection.update_one(
            {"_id": admin["_id"]},
            {
                "$set": {
                    "hashed_password": hash_password("admin123"),
                    "is_active": True,
                    "role": "admin",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print("✅ Admin password updated!")
        
    else:
        print("❌ Admin user not found. Creating new admin...")
        
        admin_doc = {
            "email": "admin@smartdoc.com",
            "full_name": "System Administrator",
            "hashed_password": hash_password("admin123"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await users_collection.insert_one(admin_doc)
        print(f"✅ Admin user created with ID: {result.inserted_id}")
    
    # List all users
    print("\n📋 All users in database:")
    all_users = await users_collection.find({}).to_list(length=100)
    for user in all_users:
        print(f"   - {user.get('email')} (ID: {user['_id']}, Role: {user.get('role')})")
    
    client.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    asyncio.run(fix_admin())
