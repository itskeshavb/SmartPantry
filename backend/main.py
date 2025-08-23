from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os

from app.api import auth, food_items, ocr, recipes, analytics, notifications, users, household, storage
from app.core.config import settings
from app.core.database import init_database
from app.core.auth_b2c import get_current_user

# Load environment variables
load_dotenv()

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Food Expiration Tracker API...")
    await init_database()
    print("Database initialized successfully")
    
    yield
    
    # Shutdown
    print("Shutting down Food Expiration Tracker API...")

# Create FastAPI app
app = FastAPI(
    title="Food Expiration Tracker API",
    description="API for tracking food expiration dates with Azure integrations",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(food_items.router, prefix="/food-items", tags=["Food Items"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
app.include_router(recipes.router, prefix="/recipes", tags=["Recipes"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(storage.router, prefix="/storage", tags=["Storage"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(household.router, prefix="/household", tags=["Household"])

@app.get("/")
async def root():
    return {
        "message": "Food Expiration Tracker API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/protected")
async def protected_route(current_user = Depends(get_current_user)):
    return {"message": "This is a protected route", "user": current_user.email}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


