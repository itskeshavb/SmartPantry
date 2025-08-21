from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

from app.core.database import get_container
from app.core.auth import get_current_user
from app.models.food_item import (
    FoodItem, FoodItemCreate, FoodItemUpdate, FoodItemResponse,
    FoodItemListResponse, ExpiringItemsResponse, FoodItemFilter
)
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=FoodItemListResponse)
async def get_food_items(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get food items with pagination and filtering"""
    try:
        container = get_container()
        
        # Build query
        query = "SELECT * FROM c WHERE c.userId = @userId"
        parameters = [{"name": "@userId", "value": current_user.id}]
        
        if category:
            query += " AND c.category = @category"
            parameters.append({"name": "@category", "value": category})
        
        if location:
            query += " AND c.location = @location"
            parameters.append({"name": "@location", "value": location})
        
        if search:
            query += " AND CONTAINS(c.name, @search, true)"
            parameters.append({"name": "@search", "value": search})
        
        # Add pagination
        query += " ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit"
        parameters.extend([
            {"name": "@offset", "value": (page - 1) * limit},
            {"name": "@limit", "value": limit + 1}  # +1 to check if there are more items
        ])
        
        # Execute query
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=False
        ))
        
        # Check if there are more items
        has_more = len(items) > limit
        if has_more:
            items = items[:-1]  # Remove the extra item
        
        # Convert to FoodItem models
        food_items = [FoodItem(**item) for item in items]
        
        return FoodItemListResponse(
            success=True,
            data=food_items,
            total=len(food_items),
            page=page,
            limit=limit,
            has_more=has_more
        )
        
    except Exception as e:
        logger.error(f"Error getting food items: {e}")
        raise HTTPException(status_code=500, detail="Failed to get food items")

@router.get("/{item_id}", response_model=FoodItemResponse)
async def get_food_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific food item by ID"""
    try:
        container = get_container()
        
        # Get item by ID and user ID
        item = container.read_item(
            item=item_id,
            partition_key=current_user.id
        )
        
        return FoodItemResponse(
            success=True,
            data=FoodItem(**item)
        )
        
    except Exception as e:
        logger.error(f"Error getting food item {item_id}: {e}")
        raise HTTPException(status_code=404, detail="Food item not found")

@router.post("/", response_model=FoodItemResponse)
async def create_food_item(
    food_item: FoodItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new food item"""
    try:
        container = get_container()
        
        # Create food item document
        item_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        item_data = {
            "id": item_id,
            "userId": current_user.id,
            "householdId": current_user.household_id,
            "name": food_item.name,
            "category": food_item.category,
            "purchaseDate": food_item.purchase_date.isoformat(),
            "expirationDate": food_item.expiration_date.isoformat(),
            "quantity": food_item.quantity,
            "unit": food_item.unit,
            "location": food_item.location,
            "notes": food_item.notes,
            "barcode": food_item.barcode,
            "imageUrl": food_item.image_url,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
        
        # Insert into Cosmos DB
        created_item = container.create_item(body=item_data)
        
        return FoodItemResponse(
            success=True,
            data=FoodItem(**created_item),
            message="Food item created successfully"
        )
        
    except Exception as e:
        logger.error(f"Error creating food item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create food item")

@router.put("/{item_id}", response_model=FoodItemResponse)
async def update_food_item(
    item_id: str,
    food_item_update: FoodItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing food item"""
    try:
        container = get_container()
        
        # Get existing item
        existing_item = container.read_item(
            item=item_id,
            partition_key=current_user.id
        )
        
        # Update fields
        update_data = {}
        for field, value in food_item_update.dict(exclude_unset=True).items():
            if value is not None:
                if field in ["purchase_date", "expiration_date"]:
                    update_data[field.replace("_", "")] = value.isoformat()
                else:
                    update_data[field.replace("_", "")] = value
        
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        # Merge with existing data
        updated_item = {**existing_item, **update_data}
        
        # Update in Cosmos DB
        result = container.replace_item(
            item=item_id,
            body=updated_item
        )
        
        return FoodItemResponse(
            success=True,
            data=FoodItem(**result),
            message="Food item updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating food item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update food item")

@router.delete("/{item_id}", response_model=FoodItemResponse)
async def delete_food_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a food item"""
    try:
        container = get_container()
        
        # Delete item
        container.delete_item(
            item=item_id,
            partition_key=current_user.id
        )
        
        return FoodItemResponse(
            success=True,
            message="Food item deleted successfully"
        )
        
    except Exception as e:
        logger.error(f"Error deleting food item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete food item")

@router.get("/expiring", response_model=ExpiringItemsResponse)
async def get_expiring_items(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user)
):
    """Get food items expiring within specified days"""
    try:
        container = get_container()
        
        # Calculate expiration threshold
        threshold_date = datetime.utcnow() + timedelta(days=days)
        
        # Query for expiring items
        query = """
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.expirationDate <= @thresholdDate
        ORDER BY c.expirationDate ASC
        """
        
        parameters = [
            {"name": "@userId", "value": current_user.id},
            {"name": "@thresholdDate", "value": threshold_date.isoformat()}
        ]
        
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=False
        ))
        
        food_items = [FoodItem(**item) for item in items]
        
        return ExpiringItemsResponse(
            success=True,
            data=food_items,
            days=days
        )
        
    except Exception as e:
        logger.error(f"Error getting expiring items: {e}")
        raise HTTPException(status_code=500, detail="Failed to get expiring items")

@router.post("/{item_id}/consume")
async def consume_food_item(
    item_id: str,
    quantity: float = Query(..., gt=0),
    current_user: User = Depends(get_current_user)
):
    """Mark a food item as consumed (reduce quantity or delete if fully consumed)"""
    try:
        container = get_container()
        
        # Get existing item
        existing_item = container.read_item(
            item=item_id,
            partition_key=current_user.id
        )
        
        current_quantity = existing_item.get("quantity", 0)
        
        if quantity >= current_quantity:
            # Fully consumed - delete item
            container.delete_item(
                item=item_id,
                partition_key=current_user.id
            )
            return {"success": True, "message": "Food item fully consumed"}
        else:
            # Partially consumed - update quantity
            existing_item["quantity"] = current_quantity - quantity
            existing_item["updatedAt"] = datetime.utcnow().isoformat()
            
            container.replace_item(
                item=item_id,
                body=existing_item
            )
            
            return {
                "success": True,
                "message": f"Consumed {quantity} {existing_item.get('unit', 'units')}",
                "remaining": existing_item["quantity"]
            }
        
    except Exception as e:
        logger.error(f"Error consuming food item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to consume food item")


