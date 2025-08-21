from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceExistsError
import asyncio
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Cosmos DB client
cosmos_client: Optional[CosmosClient] = None
database = None
container = None

async def init_database():
    """Initialize Azure Cosmos DB connection and create database/container if they don't exist"""
    global cosmos_client, database, container
    
    try:
        # Create Cosmos DB client
        cosmos_client = CosmosClient(
            settings.cosmos_db_endpoint,
            settings.cosmos_db_key
        )
        
        # Create database if it doesn't exist
        try:
            database = cosmos_client.create_database_if_not_exists(
                id=settings.cosmos_db_database
            )
            logger.info(f"Database '{settings.cosmos_db_database}' ready")
        except Exception as e:
            logger.error(f"Failed to create database: {e}")
            raise
        
        # Create container if it doesn't exist
        try:
            container = database.create_container_if_not_exists(
                id=settings.cosmos_db_container,
                partition_key=PartitionKey(path="/userId"),
                offer_throughput=400
            )
            logger.info(f"Container '{settings.cosmos_db_container}' ready")
        except Exception as e:
            logger.error(f"Failed to create container: {e}")
            raise
            
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

def get_container():
    """Get the Cosmos DB container instance"""
    if container is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return container

def get_database():
    """Get the Cosmos DB database instance"""
    if database is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return database

def get_client():
    """Get the Cosmos DB client instance"""
    if cosmos_client is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return cosmos_client

async def close_database():
    """Close the database connection"""
    global cosmos_client
    if cosmos_client:
        cosmos_client.close()
        cosmos_client = None
        logger.info("Database connection closed")


