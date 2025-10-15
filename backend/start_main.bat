@echo off
echo ============================================================
echo Starting SmartDoc MAIN Server with AI Capabilities
echo ============================================================
echo.
echo This server includes:
echo - MongoDB integration
echo - Google Gemini AI for document Q&A
echo - Full vector search with ChromaDB
echo - Document processing and summarization
echo.
echo Server will run on http://localhost:8000
echo Frontend should be on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
