import os
import google.generativeai as genai

# Test Google API key
api_key = os.getenv('GOOGLE_API_KEY')
print(f"Google API Key: {api_key[:20] if api_key else 'NOT SET'}...")

if api_key:
    try:
        genai.configure(api_key=api_key)
        # Test embedding generation
        result = genai.embed_content(model="models/text-embedding-004", content="Test content")
        print("✅ Google API key is working!")
        print(f"Embedding dimension: {len(result['embedding'])}")
    except Exception as e:
        print(f"❌ Google API key error: {str(e)}")
else:
    print("❌ Google API key is not set!")
