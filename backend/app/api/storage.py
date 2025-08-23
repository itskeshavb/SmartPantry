from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import uuid
from datetime import datetime, timedelta

from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from azure.core.exceptions import ResourceExistsError
from app.core.config import settings
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Azure Storage client
blob_service_client = BlobServiceClient.from_connection_string(
    settings.azure_storage_connection_string
)

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image to Azure Storage"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique blob name
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        blob_name = f"{current_user.id}/{uuid.uuid4()}.{file_extension}"
        
        # Get container client
        container_client = blob_service_client.get_container_client(settings.azure_storage_container)
        
        # Upload the file
        blob_client = container_client.get_blob_client(blob_name)
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Azure Storage
        blob_client.upload_blob(file_content, overwrite=True)
        
        # Generate SAS token for secure access (expires in 1 hour)
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=settings.azure_storage_container,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        
        # Generate the full URL
        blob_url = f"{blob_client.url}?{sas_token}"
        
        return {
            "success": True,
            "data": {
                "blob_name": blob_name,
                "url": blob_url,
                "content_type": file.content_type,
                "size": len(file_content)
            },
            "message": "Image uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.get("/download/{blob_name}")
async def download_image(
    blob_name: str,
    current_user: User = Depends(get_current_user)
):
    """Download an image from Azure Storage"""
    try:
        # Get container client
        container_client = blob_service_client.get_container_client(settings.azure_storage_container)
        blob_client = container_client.get_blob_client(blob_name)
        
        # Check if blob exists
        if not blob_client.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Generate SAS token for secure access
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=settings.azure_storage_container,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        
        # Generate the full URL
        blob_url = f"{blob_client.url}?{sas_token}"
        
        return {
            "success": True,
            "data": {
                "url": blob_url,
                "blob_name": blob_name
            }
        }
        
    except Exception as e:
        logger.error(f"Error downloading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to download image")

@router.delete("/delete/{blob_name}")
async def delete_image(
    blob_name: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an image from Azure Storage"""
    try:
        # Get container client
        container_client = blob_service_client.get_container_client(settings.azure_storage_container)
        blob_client = container_client.get_blob_client(blob_name)
        
        # Check if blob exists
        if not blob_client.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Delete the blob
        blob_client.delete_blob()
        
        return {
            "success": True,
            "message": "Image deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image")

@router.get("/list")
async def list_images(
    current_user: User = Depends(get_current_user),
    prefix: Optional[str] = None
):
    """List images for the current user"""
    try:
        # Get container client
        container_client = blob_service_client.get_container_client(settings.azure_storage_container)
        
        # List blobs with user prefix
        user_prefix = f"{current_user.id}/"
        blobs = container_client.list_blobs(name_starts_with=user_prefix)
        
        image_list = []
        for blob in blobs:
            # Generate SAS token for each blob
            sas_token = generate_blob_sas(
                account_name=blob_service_client.account_name,
                container_name=settings.azure_storage_container,
                blob_name=blob.name,
                account_key=blob_service_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=1)
            )
            
            blob_url = f"{container_client.url}/{blob.name}?{sas_token}"
            
            image_list.append({
                "name": blob.name,
                "url": blob_url,
                "size": blob.size,
                "created": blob.creation_time.isoformat() if blob.creation_time else None
            })
        
        return {
            "success": True,
            "data": image_list,
            "message": f"Found {len(image_list)} images"
        }
        
    except Exception as e:
        logger.error(f"Error listing images: {e}")
        raise HTTPException(status_code=500, detail="Failed to list images")
