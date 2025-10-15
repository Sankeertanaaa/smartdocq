# SmartDocQ Setup Guide

This guide will help you set up and run the SmartDocQ AI-powered document question answering system.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.9+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Google Gemini API Key** - [Get one here](https://ai.google.dev/)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd smartdoc

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend Configuration
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and add your Google Gemini API key:
```env
GOOGLE_API_KEY=your_actual_gemini_api_key_here
CHROMA_PERSIST_DIRECTORY=./chroma_db
MAX_FILE_SIZE=20971520
UPLOAD_FOLDER=./uploads
SECRET_KEY=your-secret-key-here-change-this-in-production
```

#### Frontend Configuration
```bash
cd frontend
cp env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Run the Application

#### Option A: Using the startup script (Recommended)
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

#### Option B: Manual startup
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Project Structure

```
smartdoc/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── main.py             # FastAPI app entry
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment template
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── context/        # React context
│   ├── package.json        # Node dependencies
│   └── env.example         # Environment template
├── README.md               # Project overview
├── SETUP.md               # This file
├── start.bat              # Windows startup script
└── start.sh               # Unix startup script
```

## Features

### ✅ Implemented Features
- **Document Upload**: Support for PDF, DOCX, TXT files
- **AI-Powered Q&A**: Using Google Gemini API
- **Vector Search**: ChromaDB for semantic search
- **Chat Interface**: Real-time conversation
- **Source Citations**: View document references
- **Feedback System**: Rate AI responses
- **Chat History**: Session management
- **Responsive Design**: Mobile-friendly UI

### 🔄 In Progress
- Voice input support
- Additional file formats (ODT, LaTeX, XLSX, CSV)
- User authentication
- Advanced analytics

## API Endpoints

### Document Management
- `POST /api/upload` - Upload document
- `GET /api/upload/documents` - List documents
- `DELETE /api/upload/documents/{id}` - Delete document

### Chat & Q&A
- `POST /api/chat` - Ask questions
- `POST /api/chat/follow-up` - Generate follow-up questions
- `POST /api/chat/summarize` - Document summary
- `POST /api/chat/key-points` - Extract key points

### History & Feedback
- `GET /api/history` - Get chat history
- `POST /api/history` - Save chat history
- `DELETE /api/history/{session_id}` - Delete session
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get feedback stats

## Troubleshooting

### Common Issues

#### 1. Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
cd backend
pip uninstall -r requirements.txt
pip install -r requirements.txt
```

#### 2. Frontend won't start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache and reinstall
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. API Key Issues
- Ensure your Google Gemini API key is valid
- Check that the key has proper permissions
- Verify the key is correctly set in `backend/.env`

#### 4. File Upload Issues
- Check file size (max 20MB)
- Ensure file format is supported (PDF, DOCX, TXT)
- Verify upload directory permissions

#### 5. CORS Issues
- Ensure backend is running on port 8000
- Check that frontend is configured to connect to correct backend URL
- Verify CORS settings in `backend/main.py`

### Performance Tips

1. **Large Documents**: For documents > 100 pages, processing may take longer
2. **Memory Usage**: ChromaDB stores embeddings in memory, monitor RAM usage
3. **API Limits**: Google Gemini has rate limits, implement caching for production

## Development

### Adding New Features

1. **Backend**: Add new routes in `backend/app/api/routes/`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Database**: ChromaDB is used for vector storage, consider PostgreSQL for production

### Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

### Production Considerations

1. **Environment Variables**: Use proper secret management
2. **Database**: Replace in-memory storage with persistent database
3. **Security**: Implement authentication and authorization
4. **Monitoring**: Add logging and health checks
5. **Scaling**: Consider containerization with Docker

### Docker Deployment (Future)

```dockerfile
# Example Dockerfile (to be implemented)
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8000/docs
3. Check the browser console for frontend errors
4. Review backend logs for server errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**SmartDocQ** - Making document analysis intelligent and accessible! 🤖📄 