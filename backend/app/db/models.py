# app/db/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, Date
)
from app.db.base import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False)  # 'renter' or 'landlord'
    token_balance = Column(Integer, default=0)
    wallet_address = Column(String(42), unique=True, index=True, nullable=True)
    is_priority = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    name = Column(String)
    about = Column(String)
    phone = Column(String)
    location = Column(String)
    profilePicture = Column(String)

    renter_preferences = relationship("RenterPreferences", back_populates="user", uselist=False)
    landlord_preferences = relationship("LandlordPreferences", back_populates="user", uselist=False)
    listings = relationship("Listing", back_populates="landlord")
    saved_listings = relationship("SavedListing", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("Token", back_populates="user", uselist=False)
    messages_sent = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    visit_requests = relationship("VisitRequest", back_populates="renter")

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    landlord_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=False)
    rent_price = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    property_type = Column(String(50), nullable=False)
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)
    available_from = Column(String(64), nullable=False, default="")
    max_occupants = Column(Integer, nullable=False, default=1)
    neighborhood_type = Column(String(64), nullable=True)
    neighborhood_description = Column(String(255), nullable=True)
    amenities = Column(JSON, nullable=False, default=[])
    building_features = Column(JSON, nullable=False, default=[])
    pets_allowed = Column(Boolean, default=True)
    lease_length = Column(Integer, nullable=True)
    images = Column(JSON, nullable=True, default=[])
    sqft = Column(Integer, nullable=True)
    house_rules = Column(JSON, nullable=True, default=[])

    landlord = relationship("User", back_populates="listings")
    matches = relationship("DailyMatch", back_populates="listing")
    visit_requests = relationship("VisitRequest", back_populates="listing")

class SavedListing(Base):
    __tablename__ = "saved_listings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    listing_id = Column(Integer, ForeignKey("listings.id"))
    saved_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="saved_listings")
    listing = relationship("Listing")

class RenterPreferences(Base):
    __tablename__ = "renter_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    budget_min = Column(Integer, default=0)
    budget_max = Column(Integer, default=0)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    locations = Column(JSON)
    move_in_date = Column(String)
    lease_length = Column(Integer)
    amenities = Column(JSON)
    pets_allowed = Column(Boolean, default=False)
    user = relationship("User", back_populates="renter_preferences")

class LandlordPreferences(Base):
    __tablename__ = "landlord_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    tenant_preferences = Column(JSON, nullable=False, default=[])
    lease_length = Column(Integer, nullable=True)
    pets_allowed = Column(Boolean, default=True)
    user = relationship("User", back_populates="landlord_preferences")

class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    balance = Column(Integer, nullable=False, default=0)
    user = relationship("User", back_populates="tokens")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    sender_id = Column(Integer, ForeignKey('users.id'))
    text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_approved = Column(Boolean, default=True)
    starred = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    reply_to_id = Column(Integer, ForeignKey('messages.id'), nullable=True)
    reactions = Column(JSON, default=list)
    seen_at = Column(DateTime, nullable=True)
    sender = relationship("User", back_populates="messages_sent", foreign_keys=[sender_id])
    conversation = relationship("Conversation", back_populates="messages")
    reply_to = relationship("Message", remote_side=[id])  # self-referential

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    property_name = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    renter_id = Column(Integer, ForeignKey("users.id"))
    landlord_id = Column(Integer, ForeignKey("users.id"))
    last_typing_at = Column(DateTime, nullable=True)
    messages = relationship("Message", back_populates="conversation")
    renter = relationship("User", foreign_keys=[renter_id])
    landlord = relationship("User", foreign_keys=[landlord_id])

class TokenTransaction(Base):
    __tablename__ = "token_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Integer)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class VisitRequest(Base):
    __tablename__ = "visit_requests"
    id = Column(Integer, primary_key=True, index=True)
    renter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"))
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    renter = relationship("User", back_populates="visit_requests")
    listing = relationship("Listing", back_populates="visit_requests")

class ConversationToken(Base):
    __tablename__ = "conversation_tokens"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    tokens = Column(Integer, default=0)
    __table_args__ = (
        # Unique per (conversation, user)
        {"sqlite_autoincrement": True},
    )

class DailyMatch(Base):
    __tablename__ = "daily_matches"
    id = Column(Integer, primary_key=True, index=True)
    renter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    compatibility_score = Column(Float, nullable=False)
    matched_date = Column(Date, nullable=False, index=True)
    renter = relationship("User")
    listing = relationship("Listing", back_populates="matches")
