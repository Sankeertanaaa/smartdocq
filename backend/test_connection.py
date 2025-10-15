#!/usr/bin/env python3
"""
Test database and server connections
"""
import asyncio
import motor.motor_asyncio
import requests
from app.core.config import settings

async def test_mongodb():
    """Test MongoDB connection"""
    print("🔍 Testing MongoDB connection...")
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_backend_api():
    """Test backend API"""
    print("🔍 Testing backend API...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend API - server may not be running")
        return False
    except requests.exceptions.Timeout:
        print("❌ Backend API request timed out")
        return False
    except Exception as e:
        print(f"❌ Backend API test failed: {e}")
        return False

async def main():
    """Run connection tests"""
    print("🧪 Testing SmartDoc Connections\n")
    
    # Test MongoDB
    mongo_ok = await test_mongodb()
    print()
    
    # Test Backend API
    api_ok = test_backend_api()
    print()
    
    if mongo_ok and api_ok:
        print("🎉 All connections are working!")
    else:
        print("❌ Some connections failed")
        if not mongo_ok:
            print("   - MongoDB connection issue")
        if not api_ok:
            print("   - Backend API connection issue")

if __name__ == "__main__":
    asyncio.run(main())
