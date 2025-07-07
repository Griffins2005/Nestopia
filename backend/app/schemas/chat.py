# app/schemas/chat.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class MessageBase(BaseModel):
    text: str
    reply_to_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class UserOut(BaseModel):
    id: int
    name: Optional[str] = ""
    email: Optional[EmailStr] = ""
    profilePicture: Optional[str] = ""
    created_at: datetime
    class Config:
        orm_mode = True

class MessageOut(MessageBase):
    id: int
    sender_id: int
    created_at: datetime
    is_approved: bool
    starred: bool = False
    edited_at: Optional[datetime] = None
    reply_to: Optional[Any] = None  # Nested message, can use dict for reply context
    reactions: Optional[List[dict]] = []
    seen_at: Optional[datetime] = None
    sender: Optional[UserOut] = None

    class Config:
        orm_mode = True

class ConversationBase(BaseModel):
    renter_id: int
    landlord_id: int
    listing_id: int

class ConversationCreate(ConversationBase):
    pass

class ConversationOut(ConversationBase):
    id: int
    created_at: datetime
    messages: List[MessageOut] = []
    property_title: Optional[str] = ""
    partner_name: Optional[str] = ""
    partner_avatar: Optional[str] = ""
    partner_email:  Optional[EmailStr] = ""
    last_message: Optional[str] = ""
    last_time: Optional[str] = ""
    unread_count: Optional[int] = 0
    self_user_id: Optional[int] = 0
    partner: Optional[UserOut] = None

    class Config:
        orm_mode = True

class FeatureStatus(BaseModel):
    messages_from_renter: int
    partner_tokens: int
    can_schedule_visit: bool
    can_priority_match: bool
    unlockable_features: List[str]

