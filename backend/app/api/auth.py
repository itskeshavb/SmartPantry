from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
import uuid
import logging

from app.core.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.database import get_container
from app.models.user import (
    User, UserCreate, LoginRequest, LoginResponse, 
    RegisterRequest, UserResponse, Token
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=LoginResponse)
async def register(user_data: RegisterRequest):
    """Register a new user"""
    try:
        container = get_container()
        
        # Check if user already exists
        query = "SELECT * FROM c WHERE c.email = @email"
        parameters = [{"name": "@email", "value": user_data.email}]
        
        existing_users = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        if existing_users:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        user_doc = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "password": get_password_hash(user_data.password),
            "preferences": {
                "notificationDays": 3,
                "theme": "light",
                "units": "imperial"
            },
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
        
        # Insert user into database
        created_user = container.create_item(body=user_doc)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user_id, "email": user_data.email, "name": user_data.name}
        )
        
        return LoginResponse(
            success=True,
            data={
                "token": access_token,
                "user": {
                    "id": user_id,
                    "email": user_data.email,
                    "name": user_data.name,
                    "preferences": user_doc["preferences"]
                }
            },
            message="User registered successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user")

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login user and return access token"""
    try:
        container = get_container()
        
        # Find user by email
        query = "SELECT * FROM c WHERE c.email = @email"
        parameters = [{"name": "@email", "value": login_data.email}]
        
        users = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = users[0]
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"], "name": user["name"]}
        )
        
        return LoginResponse(
            success=True,
            data={
                "token": access_token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "preferences": user.get("preferences", {}),
                    "household_id": user.get("householdId")
                }
            },
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Failed to login")

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh the access token"""
    try:
        # Create new access token
        access_token = create_access_token(
            data={"sub": current_user.id, "email": current_user.email, "name": current_user.name}
        )
        
        return {
            "success": True,
            "data": {"token": access_token},
            "message": "Token refreshed successfully"
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh token")

@router.post("/logout")
async def logout():
    """Logout user (client should discard token)"""
    return {
        "success": True,
        "message": "Logout successful"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    try:
        return UserResponse(
            success=True,
            data=current_user,
            message="User information retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information")


