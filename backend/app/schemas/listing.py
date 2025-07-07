#app/schemas/listing.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class LandlordOut(BaseModel):
    id: int
    name: str = ""
    email: Optional[EmailStr] = ""
    avatar: Optional[str] = ""
    created_at: datetime

    class Config:
        orm_mode = True

class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    rent_price: int
    property_type: str
    bedrooms: int
    bathrooms: int
    available_from: str
    max_occupants: int = 1
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    amenities: List[str] = []
    building_features: List[str] = []
    pets_allowed: bool = True
    lease_length: Optional[int] = None
    images: List[str] = []
    sqft: Optional[int] = None
    house_rules: Optional[List[str]] = []

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    rent_price: Optional[int] = None
    sqft: Optional[int] = None
    house_rules: Optional[List[str]] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    available_from: Optional[str] = None
    max_occupants: Optional[int] = None
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    amenities: Optional[List[str]] = None
    building_features: Optional[List[str]] = None
    pets_allowed: Optional[bool] = None
    lease_length: Optional[int] = None
    images: Optional[List[str]] = None

class ListingResponse(BaseModel):
    id: int
    landlord_id: int
    landlord: LandlordOut     
    title: str
    description: Optional[str] = None
    location: str
    rent_price: int
    created_at: Optional[datetime] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    sqft: Optional[int] = None
    house_rules: Optional[List[str]] = []
    bathrooms: Optional[int] = None
    available_from: Optional[str] = None
    max_occupants: Optional[int] = None
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    amenities: Optional[List[Any]] = []
    building_features: Optional[List[Any]] = []
    pets_allowed: Optional[bool] = None
    lease_length: Optional[int] = None
    images: Optional[List[str]] = []

    class Config:
        orm_mode = True

class SavedListingBase(BaseModel):
    listing_id: int

class SavedListingCreate(SavedListingBase):
    pass

class SavedListingResponse(SavedListingBase):
    id: int
    user_id: int
    saved_at: datetime

    class Config:
        orm_mode = True

class SavedListingWithDetails(BaseModel):
    id: int
    user_id: int
    saved_at: datetime
    listing: ListingResponse  # This nests the full listing

    class Config:
        orm_mode = True
