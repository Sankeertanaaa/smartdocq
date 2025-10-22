#!/usr/bin/env python3
"""
Pre-download the SentenceTransformer model during build phase
This avoids timeout issues during the first upload
"""

print("🔧 Pre-downloading SentenceTransformer model (paraphrase-MiniLM-L3-v2)...")

from sentence_transformers import SentenceTransformer

# Download the smaller, faster model - it will be cached for runtime
model = SentenceTransformer('paraphrase-MiniLM-L3-v2')

print("✅ Model downloaded and cached successfully!")
print(f"Model max sequence length: {model.max_seq_length}")
