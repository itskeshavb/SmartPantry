from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # App environment
    environment: Optional[str] = None
    # App settings
    app_name: str = "Food Expiration Tracker API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Security
    secret_key: str = "your-secret-key-here"  # Change in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database (Azure Cosmos DB)
    cosmos_db_endpoint: str = "https://your-cosmos-account.documents.azure.com:443/"
    cosmos_db_key: str = "your-cosmos-db-key"
    cosmos_db_database: str = "food-tracker"
    cosmos_db_container: str = "food-items"
    
    # Azure Computer Vision
    azure_vision_endpoint: str = "https://your-vision-resource.cognitiveservices.azure.com/"
    azure_vision_key: str = "your-vision-key"
    
    # Azure Notification Hubs
    notification_hub_connection_string: str = "your-notification-hub-connection-string"
    notification_hub_name: str = "your-notification-hub-name"
    
    # Azure Storage (for images)
    azure_storage_connection_string: str = "your-storage-connection-string"
    azure_storage_container: str = "food-images"
    
    # Azure AD B2C Authentication
    azure_b2c_tenant_name: str = "your-b2c-tenant-name"
    azure_b2c_client_id: str = "your-b2c-client-id"
    azure_b2c_policy_name: str = "B2C_1_signupsignin"
    
    # External APIs
    spoonacular_api_key: str = "your-spoonacular-api-key"
    
    # CORS
    allowed_origins: list = ["*"]  # Configure properly for production
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.debug = False
    settings.allowed_origins = [
        "https://your-frontend-domain.com",
        "https://your-mobile-app.com"
    ]
elif os.getenv("ENVIRONMENT") == "development":
    settings.debug = True
    settings.allowed_origins = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006"
    ]


