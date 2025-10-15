import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import jwt
from app.core.config import settings

async def check_user():
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DATABASE]
    users_collection = db.users
    
    # The user_id from the JWT token
    user_id_str = "68edd25c08f20b54baace9d6"
    
    print(f"🔍 Checking for user with ID: {user_id_str}")
    
    # Try to find user
    try:
        user_object_id = ObjectId(user_id_str)
        print(f"✅ Successfully converted to ObjectId: {user_object_id}")
        
        user = await users_collection.find_one({"_id": user_object_id})
        
        if user:
            print(f"✅ User found!")
            print(f"   Email: {user.get('email')}")
            print(f"   Full Name: {user.get('full_name')}")
            print(f"   Role: {user.get('role')}")
            print(f"   Active: {user.get('is_active')}")
        else:
            print(f"❌ User NOT found in database")
            print(f"\n📋 Let's check all users in the database:")
            
            all_users = await users_collection.find({}).to_list(length=100)
            print(f"   Total users: {len(all_users)}")
            for u in all_users:
                print(f"   - {u.get('email')} (ID: {u['_id']}, Role: {u.get('role')})")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Also decode the JWT token to verify
    print(f"\n🔐 Decoding JWT token...")
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGVkZDI1YzA4ZjIwYjU0YmFhY2U5ZDYiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NjA1NTI2OTV9.gSPAO7ldaEWI8M-4ZdLt0wkgjiySJbO9dZp8iWf9enU"
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"✅ Token decoded successfully")
        print(f"   Subject (user_id): {payload.get('sub')}")
        print(f"   Role: {payload.get('role')}")
        print(f"   Expiry: {payload.get('exp')}")
    except Exception as e:
        print(f"❌ Token decode error: {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())
