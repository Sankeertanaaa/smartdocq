# Upload Error Fix Guide

## Problem Summary

Upload is failing with:
- **"Failed to index document in vector store"**
- **ERR_HTTP2_PROTOCOL_ERROR** (500 Internal Server Error)
- Backend crashes during document processing

## Root Causes

### 1. Memory Issues
Large PDFs (like your 12MB file) generate many chunks. Processing all chunks at once can exceed server memory limits, especially on free-tier hosting (Render.com free tier has 512MB RAM limit).

### 2. Timeout Issues
Generating embeddings for hundreds of chunks takes time. The first upload also needs to download the SentenceTransformer model (~90MB), which can timeout.

### 3. Model Loading Failures
The `all-MiniLM-L6-v2` model needs to be downloaded and loaded into memory, which can fail on low-resource servers.

## What I Fixed

### 1. Batch Processing (`backend/app/services/vector_store.py`)
✅ **Added batch processing** - Process 50 chunks at a time instead of all at once
✅ **Progress logging** - Show which batch is being processed
✅ **Better error handling** - Catch and report specific errors

**Before:**
```python
# Process all chunks at once (memory intensive)
embeddings = self._generate_embeddings(texts)
self.collection.add(ids, embeddings, texts, metadatas)
```

**After:**
```python
# Process in batches of 50
for batch in batches:
    batch_embeddings = self._generate_embeddings(batch_texts)
    self.collection.add(batch_ids, batch_embeddings, ...)
```

### 2. Chunk Limiting (`backend/app/services/document_processor.py`)
✅ **Added MAX_CHUNKS limit** - Limit to 500 chunks per document (~500KB text)
✅ **Empty text check** - Fail early if no text extracted
✅ **Better logging** - Show chunk counts

### 3. Error Messages (`backend/app/api/routes/upload.py`)
✅ **Specific error messages** - Tell users exactly what went wrong
✅ **Proper cleanup** - Delete temp files even on error
✅ **Better error handling** - Catch memory, timeout, and model errors separately

## How to Test

### Test 1: Small Document (Should Work)
1. Upload a small PDF (< 1MB) or DOCX
2. Should process successfully
3. Check backend logs for batch processing messages

### Test 2: Medium Document
1. Upload a 5-10MB PDF
2. Watch backend logs for:
   ```
   Processing 200 texts in 4 batches of 50
   Batch 1/4: Generating embeddings for 50 texts
   Batch 1/4: Successfully added to ChromaDB
   ...
   ```

### Test 3: Large Document (Your 12MB PDF)
1. Upload SE_Unit_2_Notes.pdf
2. May be truncated to 500 chunks if very large
3. Should complete without crashing

## Expected Backend Logs

### Successful Upload:
```
🔥 REQUEST: POST /api/upload
Starting document processing for: test.pdf
Extracting text from: ./uploads/xxx.pdf
PDF has 50 pages
Extracted text length: 45000 characters
Split into 45 chunks
✅ Document processed: 45 chunks ready
Adding 45 chunks to vector store
Processing 45 texts in 1 batches of 50
Batch 1/1: Generating embeddings for 45 texts
🔧 Loading SentenceTransformer model (first time may take a moment)...
✅ SentenceTransformer model loaded successfully
✅ Encoded 45 texts successfully
Batch 1/1: Successfully added to ChromaDB
All 45 chunks successfully added to vector store
✅ Document record saved to MongoDB
🗑️ Cleaned up temporary file
```

### If Model Loading Fails:
```
❌ Error with SentenceTransformer: [error details]
⚠️ Falling back to zero embeddings (not recommended for production)
```

### If Memory Issues:
```
❌ Vector store operation failed: MemoryError
Document too large - server ran out of memory. Try uploading a smaller file.
```

## Troubleshooting

### Issue: "Embedding model failed to load"
**Cause:** Server can't download or load the SentenceTransformer model

**Solutions:**
1. **Increase server resources** (upgrade from free tier)
2. **Pre-download model** during deployment
3. **Use lighter model** (change to smaller embedding model)

**Quick Fix for Render.com:**
Add to `render.yaml` or startup command:
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Issue: "Document too large - server ran out of memory"
**Cause:** Document generates too many chunks (> 500)

**Solutions:**
1. **Split the document** into smaller files
2. **Increase MAX_CHUNKS** in `document_processor.py` (line 36)
3. **Upgrade server** to higher memory tier

### Issue: ERR_HTTP2_PROTOCOL_ERROR
**Cause:** Backend crashes or times out

**Solutions:**
1. **Check Render logs** for crash details
2. **Increase timeout** in Render settings
3. **Reduce batch size** from 50 to 25 in `vector_store.py` (line 138)

### Issue: Upload works locally but not in production
**Cause:** Different resource limits

**Solutions:**
1. **Check Render logs** for specific errors
2. **Verify model downloads** in production
3. **Test with smaller files** first

## Performance Optimization

### For Render.com Free Tier (512MB RAM):
- ✅ Batch size: 50 chunks
- ✅ Max chunks: 500 per document
- ✅ Max file size: 20MB
- ⚠️ First upload will be slow (model download)
- ⚠️ Large PDFs may be truncated

### For Paid Tier (2GB+ RAM):
- Increase batch size to 100
- Increase max chunks to 1000
- Process larger documents

### To Pre-load Model (Faster First Upload):
Add to `backend/main.py` startup:
```python
@app.on_event("startup")
async def startup_event():
    # ... existing code ...
    
    # Pre-load embedding model
    try:
        from sentence_transformers import SentenceTransformer
        print("🔧 Pre-loading embedding model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model pre-loaded")
    except Exception as e:
        print(f"⚠️ Could not pre-load model: {e}")
```

## Monitoring

### Check Backend Health:
```bash
curl https://smartdocq-ne65.onrender.com/health
```

### Check Vector Store Stats:
```bash
curl https://smartdocq-ne65.onrender.com/api/documents
```

### Watch Render Logs:
1. Go to Render dashboard
2. Select your backend service
3. Click "Logs" tab
4. Watch for errors during upload

## Next Steps

1. ✅ Code fixes applied
2. ⏳ **Deploy to Render** - Push changes to trigger redeploy
3. ⏳ **Test with small file** - Verify basic upload works
4. ⏳ **Test with your 12MB PDF** - Check if it processes or truncates
5. ⏳ **Monitor logs** - Watch for errors

## If Still Failing

### Collect Debug Info:
1. **Frontend console errors** - Copy full error message
2. **Backend logs** - Copy from Render dashboard
3. **File details** - Size, type, page count
4. **Network tab** - Check request/response details

### Temporary Workaround:
If large files keep failing:
1. Split PDF into smaller parts
2. Upload each part separately
3. Or use smaller test documents

## Production Recommendations

1. **Upgrade Render tier** - At least 1GB RAM for reliable uploads
2. **Add file size warnings** - Warn users about large files
3. **Add progress indicator** - Show upload/processing progress
4. **Add retry logic** - Auto-retry failed uploads
5. **Monitor memory usage** - Set up alerts for high memory

## Questions?

If uploads still fail after these fixes:
1. Check if it's a specific file or all files
2. Try a very small test file (< 100KB)
3. Check Render logs for the exact error
4. Verify SentenceTransformer model loaded successfully
