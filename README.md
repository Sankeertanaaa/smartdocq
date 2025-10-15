# SmartDocQ - AI-Powered Document Question Answering System

An intelligent document analysis platform that converts static documents into interactive knowledge agents using AI. Built with React.js frontend and FastAPI backend.

## Features

- 📄 **Multi-format Document Support**: Upload PDF, DOCX, TXT files
- 🤖 **AI-Powered Q&A**: Ask questions in natural language
- 🔍 **Semantic Search**: Retrieve relevant document sections
- 💬 **Conversational Interface**: Interactive chat with document context
- 📊 **Source Citations**: View exact document references
- ⭐ **Feedback System**: Rate and improve AI responses
- 📱 **Responsive Design**: Works on desktop and mobile

## Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Axios for API calls
- React Router DOM

### Backend
- FastAPI (Python)
- ChromaDB (Vector Database)
- Google Gemini API
- PyMuPDF (PDF processing)
- python-docx (DOCX processing)

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smartdoc
```

2. **Setup Backend**
```bash
cd backend
pip install -r requirements.txt
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Environment Configuration**
```bash
# Backend (.env)
GOOGLE_API_KEY=your_gemini_api_key
CHROMA_PERSIST_DIRECTORY=./chroma_db

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
```

5. **Run the Application**
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm start
```

Visit `http://localhost:3000` to use the application.

## Project Structure

```
smartdoc/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── requirements.txt
└── README.md
```

## API Endpoints

- `POST /api/upload` - Upload document
- `POST /api/chat` - Ask questions
- `GET /api/history` - Get chat history
- `POST /api/feedback` - Submit feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 