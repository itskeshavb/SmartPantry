from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import logging
import io
import base64

from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.core.credentials import AzureKeyCredential
from app.core.config import settings
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Azure Computer Vision client
vision_client = ImageAnalysisClient(
    endpoint=settings.azure_vision_endpoint,
    credential=AzureKeyCredential(settings.azure_vision_key)
)

@router.post("/process")
async def process_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Process an image using Azure Computer Vision OCR"""
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Process with Azure Computer Vision
        result = vision_client.analyze(
            image_data=image_data,
            visual_features=["read"],
            language="en"
        )
        
        # Extract text from OCR results
        ocr_results = []
        if result.read:
            for block in result.read.blocks:
                for line in block.lines:
                    for word in line.words:
                        ocr_results.append({
                            "text": word.text,
                            "confidence": word.confidence,
                            "boundingBox": {
                                "x": word.bounding_polygon[0].x,
                                "y": word.bounding_polygon[0].y,
                                "width": word.bounding_polygon[2].x - word.bounding_polygon[0].x,
                                "height": word.bounding_polygon[2].y - word.bounding_polygon[0].y
                            }
                        })
        
        # Try to extract structured data
        structured_data = extract_structured_data(ocr_results)
        
        return {
            "success": True,
            "data": ocr_results,
            "structured_data": structured_data,
            "message": f"Processed {len(ocr_results)} text elements"
        }
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image")

def extract_structured_data(ocr_results: List[dict]) -> dict:
    """Extract structured data from OCR results (product name, dates, etc.)"""
    structured_data = {
        "product_name": None,
        "purchase_date": None,
        "expiration_date": None,
        "price": None,
        "brand": None
    }
    
    # Combine all text for analysis
    all_text = " ".join([item["text"] for item in ocr_results])
    text_lower = all_text.lower()
    
    # Look for product name patterns
    product_indicators = ["product", "item", "brand", "name", "description"]
    for indicator in product_indicators:
        if indicator in text_lower:
            # Find the line containing the indicator
            for item in ocr_results:
                if indicator in item["text"].lower():
                    # Extract the next few words as product name
                    words = item["text"].split()
                    if len(words) > 1:
                        structured_data["product_name"] = " ".join(words[1:4])  # Take next 3 words
                        break
    
    # Look for date patterns
    import re
    date_patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY or DD/MM/YYYY
        r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # YYYY/MM/DD
        r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2},? \d{4}\b',  # Month DD, YYYY
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        if matches:
            if not structured_data["purchase_date"]:
                structured_data["purchase_date"] = matches[0]
            elif not structured_data["expiration_date"]:
                structured_data["expiration_date"] = matches[1] if len(matches) > 1 else matches[0]
    
    # Look for price patterns
    price_pattern = r'\$\d+\.?\d*'
    price_matches = re.findall(price_pattern, all_text)
    if price_matches:
        structured_data["price"] = price_matches[0]
    
    # Look for brand names (common food brands)
    common_brands = [
        "kraft", "nestle", "coca-cola", "pepsi", "kellogg", "general mills",
        "campbell", "heinz", "unilever", "procter & gamble", "mars", "mondelez"
    ]
    
    for brand in common_brands:
        if brand in text_lower:
            structured_data["brand"] = brand.title()
            break
    
    return structured_data

@router.post("/analyze-receipt")
async def analyze_receipt(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analyze a receipt image and extract food items"""
    try:
        # Process image with OCR
        image_data = await image.read()
        
        result = vision_client.analyze(
            image_data=image_data,
            visual_features=["read"],
            language="en"
        )
        
        # Extract text
        text_lines = []
        if result.read:
            for block in result.read.blocks:
                for line in block.lines:
                    text_lines.append(line.text)
        
        # Parse receipt for food items
        food_items = parse_receipt_items(text_lines)
        
        return {
            "success": True,
            "data": food_items,
            "message": f"Extracted {len(food_items)} food items from receipt"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze receipt")

def parse_receipt_items(text_lines: List[str]) -> List[dict]:
    """Parse receipt text lines to extract food items"""
    food_items = []
    
    # Common food keywords
    food_keywords = [
        "milk", "bread", "eggs", "cheese", "yogurt", "butter", "meat", "chicken",
        "beef", "pork", "fish", "apple", "banana", "orange", "tomato", "lettuce",
        "carrot", "potato", "onion", "garlic", "rice", "pasta", "cereal", "cookies",
        "chips", "soda", "juice", "water", "coffee", "tea", "sugar", "flour",
        "oil", "vinegar", "sauce", "spice", "herb", "frozen", "canned", "fresh"
    ]
    
    for line in text_lines:
        line_lower = line.lower()
        
        # Check if line contains food keywords
        for keyword in food_keywords:
            if keyword in line_lower:
                # Extract item name and price
                import re
                
                # Try to extract price
                price_match = re.search(r'\$\d+\.?\d*', line)
                price = price_match.group() if price_match else None
                
                # Extract item name (remove price and common receipt words)
                item_name = line
                if price:
                    item_name = item_name.replace(price, "").strip()
                
                # Clean up item name
                receipt_words = ["total", "subtotal", "tax", "change", "cash", "card", "receipt"]
                for word in receipt_words:
                    item_name = item_name.replace(word, "").strip()
                
                if item_name and len(item_name) > 2:
                    food_items.append({
                        "name": item_name,
                        "price": price,
                        "confidence": "medium"
                    })
                break
    
    return food_items


