from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ProfileReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=10, max_length=500)


class ProfileReviewOut(BaseModel):
    id: int
    rating: int
    body: str
    created_at: datetime
    reviewer_name: str
    reviewer_role: str

    class Config:
        orm_mode = True


class PublicProfileOut(BaseModel):
    id: int
    name: str
    role: str
    profilePicture: str = ""
    location: str = ""
    about: str = ""
    member_since: str
    rating_avg: Optional[float] = None
    rating_count: int = 0
    reviews: List[ProfileReviewOut] = Field(default_factory=list)
    is_self: bool = False
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_preference: Optional[str] = None
    same_person: bool = False
    can_review: bool = False