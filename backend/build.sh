#!/bin/bash
# Build script for Render deployment
# This runs during the build phase to pre-download the model

echo "🔧 Installing Python dependencies..."
pip install -r requirements.txt

echo "🔧 Pre-downloading SentenceTransformer model..."
python download_model.py

echo "✅ Build complete!"
