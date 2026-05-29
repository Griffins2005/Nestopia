#app/schemas/listing.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


class LandlordOut(BaseModel):
    id: int
    name: str = ""
    email: Optional[EmailStr] = ""
    phone: Optional[str] = ""
    contact_preference: Optional[str] = "any"
    avatar: Optional[str] = ""
    profilePicture: Optional[str] = ""
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    rent_price: int
    property_type: Optional[str] = "Apartment"
    bedrooms: Optional[int] = 1
    bathrooms: Optional[int] = 1
    available_from: Optional[str] = "Flexible"
    max_occupants: Optional[int] = 1
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    neighborhood_profile: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    building_features: List[str] = Field(default_factory=list)
    custom_tags: List[str] = Field(default_factory=list)
    pets_allowed: Optional[bool] = True
    pets: Optional[str] = None
    lease_length: Optional[Any] = 12
    images: List[str] = Field(default_factory=list)
    sqft: Optional[int] = None
    house_rules: Optional[Any] = None
    tenant_preferences: List[str] = Field(default_factory=list)
    tenant_custom_requirements: List[str] = Field(default_factory=list)

    class Config:
        extra = "ignore"


class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    rent_price: Optional[int] = None
    sqft: Optional[int] = None
    house_rules: Optional[Any] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    available_from: Optional[str] = None
    max_occupants: Optional[int] = None
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    neighborhood_profile: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    building_features: Optional[List[str]] = None
    custom_tags: Optional[List[str]] = None
    pets_allowed: Optional[bool] = None
    pets: Optional[str] = None
    lease_length: Optional[Any] = None
    images: Optional[List[str]] = None
    tenant_preferences: Optional[List[str]] = None
    tenant_custom_requirements: Optional[List[str]] = None

    class Config:
        extra = "ignore"

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
    tenant_preferences: Optional[List[str]] = []
    tenant_custom_requirements: Optional[List[str]] = []
    bathrooms: Optional[int] = None
    available_from: Optional[str] = None
    max_occupants: Optional[int] = None
    neighborhood_type: Optional[str] = None
    neighborhood_description: Optional[str] = None
    neighborhood_profile: Optional[List[str]] = []
    amenities: Optional[List[Any]] = []
    building_features: Optional[List[Any]] = []
    custom_tags: Optional[List[str]] = []
    pets_allowed: Optional[bool] = None
    lease_length: Optional[int] = None
    images: Optional[List[str]] = []
    match_score: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    pets: Optional[str] = None

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
