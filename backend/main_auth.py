from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth

app = FastAPI(
    title="SmartDocQ Auth API",
    description="Authentication system for AI-powered document question answering",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only auth routes for now
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {"message": "SmartDocQ Auth API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SmartDocQ Auth API"}
