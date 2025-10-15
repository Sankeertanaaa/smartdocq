#!/usr/bin/env python3
"""
Test script to verify document upload functionality
"""
import requests
import json
import os
from pathlib import Path

API_BASE = "http://localhost:8000"

def test_auth():
    """Test authentication endpoints"""
    print("🔐 Testing authentication...")
    
    # Test login with default admin
    login_data = {
        "email": "admin@smartdoc.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{API_BASE}/api/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✅ Authentication successful")
        return token
    else:
        print(f"❌ Authentication failed: {response.status_code} - {response.text}")
        return None

def test_upload(token):
    """Test document upload"""
    print("📄 Testing document upload...")
    
    # Create a test text file
    test_file_path = Path("test_document.txt")
    test_content = """
    This is a test document for SmartDoc upload functionality.
    
    It contains multiple paragraphs to test text processing.
    
    The document should be successfully uploaded and processed.
    """
    
    with open(test_file_path, 'w', encoding='utf-8') as f:
        f.write(test_content)
    
    # Upload the file
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(test_file_path, 'rb') as f:
        files = {"file": ("test_document.txt", f, "text/plain")}
        response = requests.post(f"{API_BASE}/api/upload", files=files, headers=headers)
    
    # Clean up test file
    test_file_path.unlink()
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Upload successful!")
        print(f"   Document ID: {result['document_id']}")
        print(f"   Filename: {result['filename']}")
        print(f"   Status: {result['status']}")
        return result['document_id']
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_documents_list(token):
    """Test documents listing"""
    print("📋 Testing documents list...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/api/documents", headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Documents list retrieved successfully!")
        print(f"   Total chunks: {result['total_chunks']}")
        print(f"   Documents count: {len(result['documents'])}")
        return True
    else:
        print(f"❌ Documents list failed: {response.status_code} - {response.text}")
        return False

def main():
    """Run all tests"""
    print("🧪 Starting SmartDoc Upload Tests\n")
    
    # Test authentication
    token = test_auth()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    print()
    
    # Test upload
    document_id = test_upload(token)
    if not document_id:
        print("❌ Upload test failed")
        return
    
    print()
    
    # Test documents list
    test_documents_list(token)
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
