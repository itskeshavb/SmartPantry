from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import logging

from app.core.database import get_container
from app.core.auth import get_current_user
from app.models.user import User, UserUpdate, UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        container = get_container()
        
        # Get user from database
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        
        # Remove sensitive information
        user_doc.pop("password", None)
        
        return UserResponse(
            success=True,
            data=User(**user_doc),
            message="Profile retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    try:
        container = get_container()
        
        # Get current user document
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        
        # Update fields
        update_data = {}
        for field, value in profile_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        # Add updated timestamp
        from datetime import datetime
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        # Merge with existing data
        updated_user = {**user_doc, **update_data}
        
        # Update in database
        result = container.replace_item(
            item=current_user.id,
            body=updated_user
        )
        
        # Remove sensitive information
        result.pop("password", None)
        
        return UserResponse(
            success=True,
            data=User(**result),
            message="Profile updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@router.delete("/profile")
async def delete_user_profile(current_user: User = Depends(get_current_user)):
    """Delete current user's profile and all associated data"""
    try:
        container = get_container()
        
        # Delete user document
        container.delete_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        
        # Note: In a real application, you would also:
        # 1. Delete all food items associated with the user
        # 2. Remove user from household
        # 3. Clean up any other user-related data
        
        return {
            "success": True,
            "message": "Profile deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user profile")

@router.get("/preferences")
async def get_user_preferences(current_user: User = Depends(get_current_user)):
    """Get current user's preferences"""
    try:
        container = get_container()
        
        # Get user document
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        
        preferences = user_doc.get("preferences", {})
        
        return {
            "success": True,
            "data": preferences
        }
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user preferences")

@router.put("/preferences")
async def update_user_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user)
):
    """Update current user's preferences"""
    try:
        container = get_container()
        
        # Get current user document
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        
        # Update preferences
        user_doc["preferences"] = {**user_doc.get("preferences", {}), **preferences}
        user_doc["updatedAt"] = datetime.utcnow().isoformat()
        
        # Update in database
        result = container.replace_item(
            item=current_user.id,
            body=user_doc
        )
        
        return {
            "success": True,
            "data": result["preferences"],
            "message": "Preferences updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user preferences")




