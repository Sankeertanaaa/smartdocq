# Dependency Fix - SentenceTransformers Import Error

## Error
```
ImportError: cannot import name 'cached_download' from 'huggingface_hub'
```

## Root Cause
The old version of `sentence-transformers` (2.2.2) was using deprecated APIs from `huggingface_hub` that have been removed in newer versions.

## Fix Applied
Updated `backend/requirements.txt`:
- ✅ `sentence-transformers==2.2.2` → `sentence-transformers==2.7.0`
- ✅ Added `huggingface-hub==0.23.0` (compatible version)

## What This Fixes
- ✅ SentenceTransformer model will load correctly
- ✅ Embeddings will be generated properly (no more zero embeddings fallback)
- ✅ Document uploads will work with proper semantic search

## Deploy Steps

### 1. Commit and Push
```bash
git add backend/requirements.txt
git commit -m "Fix sentence-transformers dependency version conflict"
git push origin main
```

### 2. Render Will Auto-Deploy
- Render will detect the requirements.txt change
- It will reinstall dependencies with the new versions
- The service will restart automatically

### 3. Verify Fix
After deployment, check Render logs for:
```
🔧 Loading SentenceTransformer model (first time may take a moment)...
✅ SentenceTransformer model loaded successfully
✅ Encoded 15 texts successfully
```

Instead of:
```
❌ Error with SentenceTransformer: cannot import name 'cached_download'
⚠️ Falling back to zero embeddings
```

## Expected Behavior After Fix

### First Upload (Model Download)
```
🔧 Loading SentenceTransformer model (first time may take a moment)...
Downloading model files... (may take 30-60 seconds)
✅ SentenceTransformer model loaded successfully
Batch 1/1: Generating embeddings for 15 texts
✅ Encoded 15 texts successfully
Batch 1/1: Successfully added to ChromaDB
All 15 chunks successfully added to vector store
```

### Subsequent Uploads (Model Cached)
```
Batch 1/1: Generating embeddings for 15 texts
✅ Encoded 15 texts successfully
Batch 1/1: Successfully added to ChromaDB
All 15 chunks successfully added to vector store
```

## Notes
- First upload after deployment will be slower (model download)
- Model is cached, so subsequent uploads will be faster
- The model file is ~90MB, so first download may take 30-60 seconds on Render
