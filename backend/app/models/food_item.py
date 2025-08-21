from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FoodCategory(str, Enum):
    DAIRY = "dairy"
    MEAT = "meat"
    PRODUCE = "produce"
    PANTRY = "pantry"
    FROZEN = "frozen"
    BEVERAGES = "beverages"
    SNACKS = "snacks"
    CONDIMENTS = "condiments"
    OTHER = "other"

class StorageLocation(str, Enum):
    FRIDGE = "fridge"
    FREEZER = "freezer"
    PANTRY = "pantry"
    COUNTER = "counter"

class FoodItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: FoodCategory
    purchase_date: datetime
    expiration_date: datetime
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=20)
    location: StorageLocation
    notes: Optional[str] = Field(None, max_length=500)
    barcode: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = None

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[FoodCategory] = None
    purchase_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    location: Optional[StorageLocation] = None
    notes: Optional[str] = Field(None, max_length=500)
    barcode: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = None

class FoodItem(FoodItemBase):
    id: str
    user_id: str
    household_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FoodItemResponse(BaseModel):
    success: bool
    data: Optional[FoodItem] = None
    error: Optional[str] = None
    message: Optional[str] = None

class FoodItemListResponse(BaseModel):
    success: bool
    data: Optional[List[FoodItem]] = None
    error: Optional[str] = None
    message: Optional[str] = None
    total: int = 0
    page: int = 1
    limit: int = 20
    has_more: bool = False

class ExpiringItemsResponse(BaseModel):
    success: bool
    data: Optional[List[FoodItem]] = None
    error: Optional[str] = None
    days: int = 7

class FoodItemFilter(BaseModel):
    category: Optional[FoodCategory] = None
    location: Optional[StorageLocation] = None
    expired: Optional[bool] = None
    expiring_soon: Optional[int] = None  # days
    search: Optional[str] = None
    page: int = 1
    limit: int = 20


