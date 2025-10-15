import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment
load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')

if not api_key:
    print("❌ GOOGLE_API_KEY not found in environment")
    exit(1)

print(f"✅ API Key found: {api_key[:20]}...")

# Configure Gemini
genai.configure(api_key=api_key)

# List available models
print("\n📋 Available Gemini models:")
print("-" * 60)

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Display name: {model.display_name}")
            print(f"   Description: {model.description[:100]}..." if len(model.description) > 100 else f"   Description: {model.description}")
            print()
except Exception as e:
    print(f"❌ Error listing models: {e}")
