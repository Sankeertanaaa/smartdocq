#!/usr/bin/env python3
"""
Pre-download the SentenceTransformer model during build time.
This prevents timeout issues during first upload.
"""

from sentence_transformers import SentenceTransformer

print("🔧 Pre-downloading SentenceTransformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model downloaded and cached successfully!")
print(f"Model max sequence length: {model.max_seq_length}")
