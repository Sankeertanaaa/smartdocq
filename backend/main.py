import os

# Disable TensorFlow/Keras in transformers to avoid tf-keras dependency
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TRANSFORMERS_NO_FLAX", "1")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, chat, history, feedback, auth, demo
from app.core.config import settings
from app.services.database import connect_to_mongo, close_mongo_connection
import time

app = FastAPI(
    title="SmartDocQ API",
    description="AI-powered document question answering system",
    version="1.0.0"
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"🔥 REQUEST: {request.method} {request.url}")
    print(f"🔥 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"🔥 RESPONSE: {response.status_code} in {process_time:.4f}s")
    
    return response

from fastapi.middleware.cors import CORSMiddleware

# CORS middleware - Allow frontend origins
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:60369",
    "https://smartdocq.vercel.app",  # Original Vercel deployment
    "https://smartdocq-indol.vercel.app",  # Your specific Vercel deployment
    "https://smartdocq-evoan947s-sankeertanas-projects.vercel.app",  # Current Vercel deployment
    "https://*.vercel.app",  # Any Vercel preview deployments
]

print(f"🔧 CORS: Allowing origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

print("✅ CORS middleware configured")

# Include API routes
# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    # Create default admin user (only if MongoDB is connected)
    from app.services.database import db
    if db.database is not None:
        await auth.create_default_admin()
    else:
        print("⚠️  Skipping admin user creation (MongoDB not available)")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])

@app.get("/")
async def root():
    return {"message": "SmartDocQ API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SmartDocQ API"} 