from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from pydantic import BaseModel, EmailStr
import os

from app.core.config import settings
from app.models.schemas import User, UserCreate, UserLogin, Token, UserResponse
from app.models.mongodb_models import UserModel
from app.services.database import get_users_collection

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Debug: Print what's being used
print(f"🔑 AUTH MODULE - Using SECRET_KEY: {SECRET_KEY[:10]}...")
print(f"🔑 AUTH MODULE - Using ALGORITHM: {ALGORITHM}")

class UserInDB(BaseModel):
    id: str
    fullName: str
    email: str
    hashed_password: str
    role: str
    created_at: datetime
    is_active: bool = True

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email from database"""
    users_collection = get_users_collection()
    return await users_collection.find_one({"email": email.lower()})

async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID from database"""
    users_collection = get_users_collection()
    from bson import ObjectId
    try:
        print(f"🔍 Looking up user by ID: {user_id}")
        
        # Try as string first (for databases with string IDs)
        user = await users_collection.find_one({"_id": user_id})
        if user:
            print(f"✅ User found by string ID: {user.get('email')}")
            return user
        
        # Try as ObjectId (for properly formatted databases)
        try:
            object_id = ObjectId(user_id)
            print(f"🔍 Trying as ObjectId: {object_id}")
            user = await users_collection.find_one({"_id": object_id})
            if user:
                print(f"✅ User found by ObjectId: {user.get('email')}")
                return user
        except:
            pass
        
        print(f"❌ User not found with ID: {user_id}")
        return None
        
    except Exception as e:
        print(f"❌ Error in get_user_by_id: {e}")
        import traceback
        traceback.print_exc()
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"🔐 Verifying token with SECRET_KEY: {SECRET_KEY[:10]}...")
        print(f"🔐 Token starts with: {credentials.credentials[:30]}...")
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print(f"✅ Token decoded successfully, user_id: {user_id}")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError as e:
        print(f"❌ JWT decode error: {e}")
        raise credentials_exception
    
    user = await get_user_by_id(user_id)
    if user is None:
        print(f"❌ User not found for id: {user_id}")
        raise credentials_exception
    
    print(f"✅ User authenticated: {user.get('email')}")
    return user

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    """Register a new user"""
    users_collection = get_users_collection()
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    if user_data.role not in ["student", "guest"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Only 'student' and 'guest' roles are allowed for registration"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    
    new_user = UserModel(
        full_name=user_data.fullName,
        email=user_data.email.lower(),
        hashed_password=hashed_password,
        role=user_data.role,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Store user in MongoDB
    result = await users_collection.insert_one(new_user.dict(by_alias=True))
    
    if result.inserted_id:
        return {
            "message": "User registered successfully",
            "user": {
                "id": str(result.inserted_id),
                "fullName": new_user.full_name,
                "email": new_user.email,
                "role": new_user.role
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user and return JWT token"""
    users_collection = get_users_collection()
    
    # Get user from database
    user_doc = await users_collection.find_one({"email": user_credentials.email.lower()})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    print(f"🔑 Creating token with SECRET_KEY: {SECRET_KEY[:10]}...")
    access_token = create_access_token(
        data={"sub": str(user_doc["_id"]), "role": user_doc["role"]}, 
        expires_delta=access_token_expires
    )
    print(f"✅ Token created: {access_token[:30]}...")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user_doc["_id"]),
            "fullName": user_doc["full_name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "is_active": user_doc.get("is_active", True)
        }
    }

@router.get("/verify", response_model=UserResponse)
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify JWT token and return user information"""
    return {
        "id": str(current_user["_id"]),
        "fullName": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user.get("is_active", True)
    }

@router.post("/logout", response_model=dict)
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": str(current_user["_id"]),
        "fullName": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user.get("is_active", True)
    }

# Admin-only endpoints
@router.get("/users", response_model=list[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_collection = get_users_collection()
    cursor = users_collection.find({})
    users = await cursor.to_list(length=None)
    
    return [
        {
            "id": str(user["_id"]),
            "fullName": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "is_active": user.get("is_active", True)
        }
        for user in users
    ]

@router.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Deactivate a user (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    users_collection = get_users_collection()
    from bson import ObjectId
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": f"User {user['full_name']} has been deactivated"}

# Create a default admin user for testing
async def create_default_admin():
    """Create a default admin user for testing purposes"""
    admin_email = "admin@smartdoc.com"
    users_collection = get_users_collection()
    
    existing_admin = await users_collection.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = UserModel(
            full_name="System Administrator",
            email=admin_email,
            hashed_password=hash_password("admin123"),
            role="admin",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await users_collection.insert_one(admin_user.dict(by_alias=True))
        print(f"Default admin user created: {admin_email} / admin123")
    else:
        # Ensure the existing admin remains accessible in development
        from bson import ObjectId
        await users_collection.update_one(
            {"_id": existing_admin["_id"]},
            {
                "$set": {
                    "role": "admin",
                    "is_active": True,
                    "hashed_password": hash_password("admin123"),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        print(f"Default admin ensured/updated: {admin_email} / admin123")
