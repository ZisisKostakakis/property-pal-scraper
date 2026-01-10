from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re


class PropertyListing(BaseModel):
    """Pydantic model for PropertyPal property listings"""

    # Identifiers
    property_id: str
    url: str
    scraped_at: datetime = Field(default_factory=datetime.now)

    # Header Info (from property detail page)
    price: Optional[int] = None  # £105,000 → 105000
    currency: str = "GBP"
    location: str
    property_type: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    receptions: Optional[int] = None

    # Property Features
    size: Optional[str] = None  # "60 sq m (645.8 sq ft)"
    tenure: Optional[str] = None  # "Leasehold" or "Freehold"
    energy_rating: Optional[str] = None  # "F28/F37"
    heating: Optional[str] = None  # "Oil", "Gas", etc.

    # Property Financials
    typical_mortgage: Optional[str] = None  # "£460.69 per month"
    rates: Optional[str] = None  # "£863.37 pa"

    # Description Details
    description: Optional[str] = None
    additional_info: Optional[str] = None  # Bullet points
    room_details: Optional[List[str]] = Field(default_factory=list)  # Ground/First/Second floor rooms
    directions: Optional[str] = None
    features: List[str] = Field(default_factory=list)  # "UPVC Double Glazing", etc.

    # Metadata
    listing_status: str = "forSale"

    # Perplexity Rating
    perplexity_rating: Optional[float] = None
    perplexity_analysis: Optional[str] = None
    calculated_monthly_payment: Optional[float] = None

    # Distance to destination (in km)
    distance_to_destination: Optional[float] = None

    @field_validator('price', mode='before')
    @classmethod
    def clean_price(cls, v):
        """Extract numeric price from string like '£105,000' or 'Guide Price £105,000'"""
        if v is None:
            return None
        if isinstance(v, int):
            return v
        # Remove £, commas, and extract first number
        cleaned = re.sub(r'[£,]', '', str(v))
        match = re.search(r'\d+', cleaned)
        if match:
            return int(match.group())
        return None

    @field_validator('bedrooms', 'bathrooms', 'receptions', mode='before')
    @classmethod
    def extract_number(cls, v):
        """Extract number from strings like '2 Bedrooms' or '2'"""
        if v is None:
            return None
        if isinstance(v, int):
            return v
        # Extract first digit sequence
        match = re.search(r'\d+', str(v))
        if match:
            return int(match.group())
        return None


    class Config:
        # Allow JSON serialization of datetime
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
