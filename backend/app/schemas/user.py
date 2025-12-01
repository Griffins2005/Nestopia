#app/schemas/user.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any

class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserInDB(UserBase):
    id: int
    wallet_address: Optional[str]
    is_priority: bool
    renter_preferences: Optional[Any]
    landlord_preferences: Optional[Any]
    class Config:
        orm_mode = True

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = ""
    profilePicture: Optional[str] = ""
    created_at: datetime

    class Config:
        orm_mode = True
        
# Renter
class RenterPreferencesIn(BaseModel):
    budget_min: int = 0
    budget_max: int = 0
    bedrooms: int = 1
    bathrooms: int = 1
    household_size: int = Field(default=1, ge=1)
    locations: List[str] = Field(default_factory=list)
    move_in_date: str = "Flexible"
    lease_length: int = 12
    amenities: List[str] = Field(default_factory=list)
    building_amenities: List[str] = Field(default_factory=list)
    pets_allowed: bool = True
    smoking_preference: Optional[str] = None
    noise_tolerance: Optional[str] = None
    visitor_flexibility: Optional[str] = None
    custom_preferences: List[str] = Field(default_factory=list)

class RenterPreferencesOut(RenterPreferencesIn):
    id: int
    class Config:
        orm_mode = True

# Landlord
class LandlordPreferencesIn(BaseModel):
    tenant_preferences: List[str] = Field(default_factory=list)
    lease_length: Optional[int] = None
    pets_allowed: Optional[bool] = True
    custom_requirements: List[str] = Field(default_factory=list)

class LandlordPreferencesOut(LandlordPreferencesIn):
    id: int
    class Config:
        orm_mode = True


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    name: Optional[str] = None
    about: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profilePicture: Optional[str] = None
    wallet_address: Optional[str] = None
    renter_preferences: Optional[Any] = None
    landlord_preferences: Optional[Any] = None
    created_at: datetime 
    class Config:
        orm_mode = True

class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    about: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profilePicture: Optional[str] = None
    documents: Optional[List[str]] = None
