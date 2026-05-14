from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings
from app.models.mongodb_models import UserModel
from app.models.schemas import (
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.database import get_users_collection

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


class UserInDB(BaseModel):
    id: str
    fullName: str
    email: str
    hashed_password: str
    role: str
    created_at: datetime
    is_active: bool = True


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()

    expire = (
        datetime.utcnow() + expires_delta
        if expires_delta
        else datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


async def get_user_by_email(email: str):
    users_collection = get_users_collection()

    if users_collection is None:
        return None

    return await users_collection.find_one({
        "email": email.lower()
    })


async def get_user_by_id(user_id: str):
    users_collection = get_users_collection()

    if users_collection is None:
        return None

    try:
        return await users_collection.find_one({
            "_id": ObjectId(user_id)
        })

    except Exception:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )

    except jwt.PyJWTError:
        raise credentials_exception

    user = await get_user_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user


@router.post("/register")
async def register(user_data: UserCreate):
    users_collection = get_users_collection()

    if users_collection is None:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )

    existing_user = await users_collection.find_one({
        "email": user_data.email.lower()
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)

    new_user = UserModel(
        full_name=user_data.fullName.strip(),
        email=user_data.email.lower(),
        hashed_password=hashed_password,
        role=user_data.role,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    result = await users_collection.insert_one(
        new_user.dict(by_alias=True)
    )

    return {
        "message": "User registered successfully",
        "user": {
            "id": str(result.inserted_id),
            "fullName": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
        }
    }


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    users_collection = get_users_collection()

    if users_collection is None:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )

    user_doc = await users_collection.find_one({
        "email": user_credentials.email.lower()
    })

    if not user_doc:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not verify_password(
        user_credentials.password,
        user_doc["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(user_doc["_id"]),
            "role": user_doc["role"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user_doc["_id"]),
            "fullName": user_doc["full_name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "is_active": user_doc.get("is_active", True),
        }
    }


@router.get("/verify", response_model=UserResponse)
async def verify_token(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": str(current_user["_id"]),
        "fullName": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user.get("is_active", True),
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": str(current_user["_id"]),
        "fullName": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user.get("is_active", True),
    }


@router.post("/logout")
async def logout():
    return {
        "message": "Successfully logged out"
    }


async def create_default_admin():
    try:
        users_collection = get_users_collection()

        if users_collection is None:
            return

        admin_email = "admin@smartdoc.com"

        existing_admin = await users_collection.find_one({
            "email": admin_email
        })

        if existing_admin:
            return

        admin_user = UserModel(
            full_name="System Administrator",
            email=admin_email,
            hashed_password=hash_password("admin123"),
            role="admin",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        await users_collection.insert_one(
            admin_user.dict(by_alias=True)
        )

        print("Default admin created")

    except Exception as e:
        print(f"Admin creation failed: {e}")