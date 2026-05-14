from datetime import datetime
from contextlib import asynccontextmanager
import time

import fastapi
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    upload,
    chat,
    history,
    feedback,
    auth,
    demo,
    study_guide
)

from app.services.database import (
    connect_to_mongo,
    close_mongo_connection
)


# Custom JSON encoder
original_jsonable_encoder = fastapi.encoders.jsonable_encoder


def custom_jsonable_encoder(obj, **kwargs):
    if isinstance(obj, datetime):
        return obj.isoformat()

    if hasattr(obj, "isoformat") and callable(obj.isoformat):
        return obj.isoformat()

    return original_jsonable_encoder(obj, **kwargs)


fastapi.encoders.jsonable_encoder = custom_jsonable_encoder


# App lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()

    try:
        from app.services.database import db

        if db.database is not None:
            await auth.create_default_admin()
            print("✅ MongoDB connected")
        else:
            print("⚠️ MongoDB not connected")

    except Exception as e:
        print(f"⚠️ Startup warning: {e}")

    yield

    # Shutdown
    await close_mongo_connection()


# FastAPI app
app = FastAPI(
    title="SmartDocQ API",
    description="AI-powered document question answering system",
    version="1.0.5",
    lifespan=lifespan
)

app.default_response_class = JSONResponse


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    print(f"{request.method} {request.url}")

    response = await call_next(request)

    process_time = time.time() - start_time

    print(f"Response: {response.status_code} ({process_time:.4f}s)")

    return response


# CORS
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "https://smartdocq.vercel.app",
    "https://smartdocq-indol.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["authentication"]
)

app.include_router(
    upload.router,
    prefix="/api",
    tags=["upload"]
)

app.include_router(
    chat.router,
    prefix="/api",
    tags=["chat"]
)

app.include_router(
    history.router,
    prefix="/api",
    tags=["history"]
)

app.include_router(
    feedback.router,
    prefix="/api",
    tags=["feedback"]
)

app.include_router(
    study_guide.router,
    prefix="/api",
    tags=["study_guide"]
)

app.include_router(
    demo.router,
    prefix="/api/demo",
    tags=["demo"]
)

# Root endpoints
@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "SmartDocQ API is running!"
    }


@app.get("/health")
@app.head("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SmartDocQ API"
    }