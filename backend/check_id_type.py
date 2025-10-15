"""
Check the actual type of _id fields in the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DATABASE = "smartdocq"

async def check_id_types():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DATABASE]
    users_collection = db.users
    
    print("Checking _id field types in users collection...\n")
    
    all_users = await users_collection.find({}).to_list(length=100)
    
    for user in all_users:
        user_id = user['_id']
        print(f"Email: {user.get('email')}")
        print(f"  _id value: {user_id}")
        print(f"  _id type: {type(user_id)}")
        print(f"  _id is ObjectId: {isinstance(user_id, ObjectId)}")
        print(f"  _id str: {str(user_id)}")
        
        # Try to query by this exact _id
        found = await users_collection.find_one({"_id": user_id})
        print(f"  Can find by _id: {found is not None}")
        
        # Try to query by ObjectId conversion
        try:
            found_by_objectid = await users_collection.find_one({"_id": ObjectId(str(user_id))})
            print(f"  Can find by ObjectId(str(_id)): {found_by_objectid is not None}")
        except Exception as e:
            print(f"  Error with ObjectId conversion: {e}")
        
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_id_types())
