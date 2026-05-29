from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ApplicationCreateIn(BaseModel):
    listing_id: int


class MoveInDateIn(BaseModel):
    move_in_date: date


class TourProposeIn(BaseModel):
    scheduled_at: datetime


class TourOut(BaseModel):
    id: int
    application_id: int
    proposed_by_id: int
    scheduled_at: datetime
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class ApplicationOut(BaseModel):
    id: int
    listing_id: int
    listing_title: str
    tenant_id: int
    tenant_name: str
    landlord_id: int
    landlord_name: str
    status: str
    move_in_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    pending_tour: Optional[TourOut] = None
    is_tenant: bool = False
    is_landlord: bool = False


class ActivityItemOut(BaseModel):
    kind: str
    title: str
    subtitle: str
    at: datetime
    icon: str
    application_id: Optional[int] = None


class ActivityFeedOut(BaseModel):
    activity: List[ActivityItemOut] = Field(default_factory=list)
    applications: List[ApplicationOut] = Field(default_factory=list)
