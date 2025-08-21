from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import logging
import uuid

from app.core.database import get_container
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
async def get_household(current_user: User = Depends(get_current_user)):
    """Get current user's household information"""
    try:
        if not current_user.household_id:
            return {
                "success": True,
                "data": None,
                "message": "User is not part of a household"
            }
        
        container = get_container()
        
        # Get household document
        household_doc = container.read_item(
            item=current_user.household_id,
            partition_key=current_user.household_id
        )
        
        return {
            "success": True,
            "data": household_doc
        }
        
    except Exception as e:
        logger.error(f"Error getting household: {e}")
        raise HTTPException(status_code=500, detail="Failed to get household")

@router.post("/")
async def create_household(
    name: str,
    current_user: User = Depends(get_current_user)
):
    """Create a new household"""
    try:
        container = get_container()
        
        # Check if user is already in a household
        if current_user.household_id:
            raise HTTPException(status_code=400, detail="User is already part of a household")
        
        # Create household document
        household_id = str(uuid.uuid4())
        from datetime import datetime
        now = datetime.utcnow()
        
        household_doc = {
            "id": household_id,
            "name": name,
            "ownerId": current_user.id,
            "members": [current_user.id],
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
        
        # Insert household into database
        created_household = container.create_item(body=household_doc)
        
        # Update user's household_id
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        user_doc["householdId"] = household_id
        user_doc["updatedAt"] = now.isoformat()
        
        container.replace_item(
            item=current_user.id,
            body=user_doc
        )
        
        return {
            "success": True,
            "data": created_household,
            "message": "Household created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating household: {e}")
        raise HTTPException(status_code=500, detail="Failed to create household")

@router.post("/invite")
async def invite_to_household(
    email: str,
    current_user: User = Depends(get_current_user)
):
    """Invite a user to join the household"""
    try:
        if not current_user.household_id:
            raise HTTPException(status_code=400, detail="User is not part of a household")
        
        container = get_container()
        
        # Get household document
        household_doc = container.read_item(
            item=current_user.household_id,
            partition_key=current_user.household_id
        )
        
        # Check if user is the owner
        if household_doc["ownerId"] != current_user.id:
            raise HTTPException(status_code=403, detail="Only household owner can invite members")
        
        # Find user by email
        query = "SELECT * FROM c WHERE c.email = @email"
        parameters = [{"name": "@email", "value": email}]
        
        users = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        invited_user = users[0]
        
        # Check if user is already in a household
        if invited_user.get("householdId"):
            raise HTTPException(status_code=400, detail="User is already part of a household")
        
        # In a real application, you would:
        # 1. Send an email invitation
        # 2. Create an invitation record
        # 3. Handle invitation acceptance/rejection
        
        logger.info(f"Invitation sent to {email} for household {current_user.household_id}")
        
        return {
            "success": True,
            "message": f"Invitation sent to {email}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user to household: {e}")
        raise HTTPException(status_code=500, detail="Failed to send invitation")

@router.post("/join")
async def join_household(
    household_id: str,
    current_user: User = Depends(get_current_user)
):
    """Join a household (after accepting invitation)"""
    try:
        if current_user.household_id:
            raise HTTPException(status_code=400, detail="User is already part of a household")
        
        container = get_container()
        
        # Get household document
        household_doc = container.read_item(
            item=household_id,
            partition_key=household_id
        )
        
        # Add user to household members
        if current_user.id not in household_doc["members"]:
            household_doc["members"].append(current_user.id)
            household_doc["updatedAt"] = datetime.utcnow().isoformat()
            
            container.replace_item(
                item=household_id,
                body=household_doc
            )
        
        # Update user's household_id
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        user_doc["householdId"] = household_id
        user_doc["updatedAt"] = datetime.utcnow().isoformat()
        
        container.replace_item(
            item=current_user.id,
            body=user_doc
        )
        
        return {
            "success": True,
            "message": "Successfully joined household"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining household: {e}")
        raise HTTPException(status_code=500, detail="Failed to join household")

@router.delete("/leave")
async def leave_household(current_user: User = Depends(get_current_user)):
    """Leave the current household"""
    try:
        if not current_user.household_id:
            raise HTTPException(status_code=400, detail="User is not part of a household")
        
        container = get_container()
        
        # Get household document
        household_doc = container.read_item(
            item=current_user.household_id,
            partition_key=current_user.household_id
        )
        
        # Remove user from household members
        if current_user.id in household_doc["members"]:
            household_doc["members"].remove(current_user.id)
            household_doc["updatedAt"] = datetime.utcnow().isoformat()
            
            # If user is the owner and there are other members, transfer ownership
            if household_doc["ownerId"] == current_user.id and len(household_doc["members"]) > 0:
                household_doc["ownerId"] = household_doc["members"][0]
            
            container.replace_item(
                item=current_user.household_id,
                body=household_doc
            )
        
        # Update user's household_id
        user_doc = container.read_item(
            item=current_user.id,
            partition_key=current_user.id
        )
        user_doc["householdId"] = None
        user_doc["updatedAt"] = datetime.utcnow().isoformat()
        
        container.replace_item(
            item=current_user.id,
            body=user_doc
        )
        
        return {
            "success": True,
            "message": "Successfully left household"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving household: {e}")
        raise HTTPException(status_code=500, detail="Failed to leave household")

@router.get("/members")
async def get_household_members(current_user: User = Depends(get_current_user)):
    """Get all members of the current household"""
    try:
        if not current_user.household_id:
            raise HTTPException(status_code=400, detail="User is not part of a household")
        
        container = get_container()
        
        # Get household document
        household_doc = container.read_item(
            item=current_user.household_id,
            partition_key=current_user.household_id
        )
        
        # Get member details
        members = []
        for member_id in household_doc["members"]:
            try:
                member_doc = container.read_item(
                    item=member_id,
                    partition_key=member_id
                )
                members.append({
                    "id": member_id,
                    "name": member_doc["name"],
                    "email": member_doc["email"],
                    "isOwner": member_id == household_doc["ownerId"]
                })
            except Exception as e:
                logger.warning(f"Could not get details for member {member_id}: {e}")
        
        return {
            "success": True,
            "data": members
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting household members: {e}")
        raise HTTPException(status_code=500, detail="Failed to get household members")



