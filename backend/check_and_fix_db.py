"""
Check and fix database issues
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt
from datetime import datetime

MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DATABASE = "smartdocq"

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def check_and_fix():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DATABASE]
    users_collection = db.users
    
    print("=" * 60)
    print("DATABASE DIAGNOSTIC AND FIX TOOL")
    print("=" * 60)
    
    # Check all users
    print("\n📋 Checking all users in database...")
    all_users = await users_collection.find({}).to_list(length=100)
    print(f"   Total users found: {len(all_users)}\n")
    
    if len(all_users) == 0:
        print("❌ No users found in database!")
    else:
        for i, user in enumerate(all_users, 1):
            print(f"{i}. Email: {user.get('email')}")
            print(f"   ID: {user['_id']}")
            print(f"   Full Name: {user.get('full_name')}")
            print(f"   Role: {user.get('role')}")
            print(f"   Active: {user.get('is_active')}")
            print()
    
    # Check for the specific user ID from the token
    target_id = "68edd25c08f20b54baace9d6"
    print(f"🔍 Looking for user with ID: {target_id}")
    try:
        user = await users_collection.find_one({"_id": ObjectId(target_id)})
        if user:
            print(f"✅ User found: {user.get('email')}")
        else:
            print(f"❌ User with ID {target_id} NOT FOUND")
    except Exception as e:
        print(f"❌ Error looking up user: {e}")
    
    # Check for admin user
    print(f"\n🔍 Looking for admin@smartdoc.com...")
    admin = await users_collection.find_one({"email": "admin@smartdoc.com"})
    
    if admin:
        print(f"✅ Admin user exists!")
        print(f"   ID: {admin['_id']}")
        print(f"   Role: {admin.get('role')}")
        
        # Update admin to ensure it's correct
        print("\n🔧 Updating admin user...")
        await users_collection.update_one(
            {"_id": admin["_id"]},
            {
                "$set": {
                    "hashed_password": hash_password("admin123"),
                    "is_active": True,
                    "role": "admin",
                    "full_name": "System Administrator",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print("✅ Admin user updated!")
        
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
    
    # Show final state
    print("\n" + "=" * 60)
    print("FINAL DATABASE STATE")
    print("=" * 60)
    all_users = await users_collection.find({}).to_list(length=100)
    for i, user in enumerate(all_users, 1):
        print(f"{i}. {user.get('email')} (ID: {user['_id']}, Role: {user.get('role')})")
    
    print("\n✅ Database check complete!")
    print("\n📝 NEXT STEPS:")
    print("   1. Log out from the frontend")
    print("   2. Log in again with: admin@smartdoc.com / admin123")
    print("   3. Try using the chat")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_and_fix())
