from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.core.database import get_container
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/waste-report")
async def get_food_waste_report(
    month: str = Query(..., description="Month in YYYY-MM format"),
    current_user: User = Depends(get_current_user)
):
    """Get food waste report for a specific month"""
    try:
        container = get_container()
        
        # Parse month
        try:
            report_date = datetime.strptime(month, "%Y-%m")
            start_date = report_date.replace(day=1)
            if report_date.month == 12:
                end_date = report_date.replace(year=report_date.year + 1, month=1, day=1)
            else:
                end_date = report_date.replace(month=report_date.month + 1, day=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
        
        # Query food items for the month
        query = """
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.createdAt >= @startDate 
        AND c.createdAt < @endDate
        """
        
        parameters = [
            {"name": "@userId", "value": current_user.id},
            {"name": "@startDate", "value": start_date.isoformat()},
            {"name": "@endDate", "value": end_date.isoformat()}
        ]
        
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=False
        ))
        
        # Calculate waste metrics
        total_items = len(items)
        expired_items = 0
        consumed_items = 0
        total_value = 0.0
        
        for item in items:
            expiration_date = datetime.fromisoformat(item["expirationDate"])
            created_date = datetime.fromisoformat(item["createdAt"])
            
            # Check if item expired
            if expiration_date < datetime.utcnow():
                expired_items += 1
            
            # Estimate value (in a real app, you'd track actual prices)
            total_value += 5.0  # Assume $5 per item
        
        # Calculate waste score
        waste_score = (expired_items / total_items * 100) if total_items > 0 else 0
        consumed_items = total_items - expired_items
        
        # Calculate potential savings
        savings = expired_items * 5.0  # Assume $5 per wasted item
        
        report = {
            "month": month,
            "totalItems": total_items,
            "expiredItems": expired_items,
            "consumedItems": consumed_items,
            "wasteScore": round(waste_score, 1),
            "savings": round(savings, 2),
            "totalValue": round(total_value, 2)
        }
        
        return {
            "success": True,
            "data": report
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating waste report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate waste report")

@router.get("/waste-history")
async def get_waste_history(
    months: int = Query(6, ge=1, le=12, description="Number of months to include"),
    current_user: User = Depends(get_current_user)
):
    """Get food waste history for the last N months"""
    try:
        container = get_container()
        
        reports = []
        current_date = datetime.utcnow()
        
        for i in range(months):
            # Calculate month
            if current_date.month - i <= 0:
                year = current_date.year - 1
                month = 12 + (current_date.month - i)
            else:
                year = current_date.year
                month = current_date.month - i
            
            month_str = f"{year:04d}-{month:02d}"
            
            # Get report for this month
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            
            # Query items for this month
            query = """
            SELECT * FROM c 
            WHERE c.userId = @userId 
            AND c.createdAt >= @startDate 
            AND c.createdAt < @endDate
            """
            
            parameters = [
                {"name": "@userId", "value": current_user.id},
                {"name": "@startDate", "value": start_date.isoformat()},
                {"name": "@endDate", "value": end_date.isoformat()}
            ]
            
            items = list(container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=False
            ))
            
            # Calculate metrics
            total_items = len(items)
            expired_items = sum(1 for item in items 
                              if datetime.fromisoformat(item["expirationDate"]) < datetime.utcnow())
            
            waste_score = (expired_items / total_items * 100) if total_items > 0 else 0
            savings = expired_items * 5.0  # Assume $5 per wasted item
            
            reports.append({
                "month": month_str,
                "totalItems": total_items,
                "expiredItems": expired_items,
                "consumedItems": total_items - expired_items,
                "wasteScore": round(waste_score, 1),
                "savings": round(savings, 2)
            })
        
        # Sort by month (newest first)
        reports.sort(key=lambda x: x["month"], reverse=True)
        
        return {
            "success": True,
            "data": reports
        }
        
    except Exception as e:
        logger.error(f"Error getting waste history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get waste history")

@router.get("/category-breakdown")
async def get_category_breakdown(
    current_user: User = Depends(get_current_user)
):
    """Get food waste breakdown by category"""
    try:
        container = get_container()
        
        # Get all items for the current user
        query = "SELECT * FROM c WHERE c.userId = @userId"
        parameters = [{"name": "@userId", "value": current_user.id}]
        
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=False
        ))
        
        # Group by category
        category_stats = {}
        
        for item in items:
            category = item.get("category", "other")
            if category not in category_stats:
                category_stats[category] = {
                    "total": 0,
                    "expired": 0,
                    "consumed": 0
                }
            
            category_stats[category]["total"] += 1
            
            # Check if expired
            expiration_date = datetime.fromisoformat(item["expirationDate"])
            if expiration_date < datetime.utcnow():
                category_stats[category]["expired"] += 1
            else:
                category_stats[category]["consumed"] += 1
        
        # Calculate waste scores for each category
        breakdown = []
        for category, stats in category_stats.items():
            waste_score = (stats["expired"] / stats["total"] * 100) if stats["total"] > 0 else 0
            breakdown.append({
                "category": category,
                "totalItems": stats["total"],
                "expiredItems": stats["expired"],
                "consumedItems": stats["consumed"],
                "wasteScore": round(waste_score, 1)
            })
        
        # Sort by waste score (highest first)
        breakdown.sort(key=lambda x: x["wasteScore"], reverse=True)
        
        return {
            "success": True,
            "data": breakdown
        }
        
    except Exception as e:
        logger.error(f"Error getting category breakdown: {e}")
        raise HTTPException(status_code=500, detail="Failed to get category breakdown")

@router.get("/expiring-soon")
async def get_expiring_soon_analytics(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user)
):
    """Get analytics for items expiring soon"""
    try:
        container = get_container()
        
        # Calculate threshold date
        threshold_date = datetime.utcnow() + timedelta(days=days)
        
        # Query expiring items
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
        
        # Group by days until expiration
        expiration_groups = {}
        
        for item in items:
            expiration_date = datetime.fromisoformat(item["expirationDate"])
            days_until_expiration = (expiration_date - datetime.utcnow()).days
            
            if days_until_expiration not in expiration_groups:
                expiration_groups[days_until_expiration] = []
            
            expiration_groups[days_until_expiration].append(item)
        
        # Format results
        analytics = {
            "totalExpiring": len(items),
            "daysThreshold": days,
            "byDaysUntilExpiration": [
                {
                    "daysUntilExpiration": days_left,
                    "itemCount": len(items_list),
                    "items": items_list
                }
                for days_left, items_list in sorted(expiration_groups.items())
            ]
        }
        
        return {
            "success": True,
            "data": analytics
        }
        
    except Exception as e:
        logger.error(f"Error getting expiring soon analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get expiring soon analytics")



