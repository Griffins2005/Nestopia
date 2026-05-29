# app/db/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, Date, UniqueConstraint
)
from app.db.base import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable for Google OAuth
    role = Column(String(10), nullable=False)  # 'renter' or 'landlord'
    auth_method = Column(String(16), nullable=False, default="email")  # 'email' or 'google'
    token_balance = Column(Integer, default=0)
    wallet_address = Column(String(42), unique=True, index=True, nullable=True)
    is_priority = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    name = Column(String)
    about = Column(String)
    phone = Column(String)
    contact_preference = Column(String(10), nullable=False, default="any")  # any | text | email
    location = Column(String)
    profilePicture = Column(String)
    totp_secret = Column(String(64), nullable=True)
    totp_enabled = Column(Boolean, default=False, nullable=False)
    __table_args__ = (
        UniqueConstraint('email', 'role', name='unique_email_role'),
    )

    renter_preferences = relationship("RenterPreferences", back_populates="user", uselist=False)
    landlord_preferences = relationship("LandlordPreferences", back_populates="user", uselist=False)
    listings = relationship("Listing", back_populates="landlord")
    saved_listings = relationship("SavedListing", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("Token", back_populates="user", uselist=False)
    visit_requests = relationship("VisitRequest", back_populates="renter")
    reviews_written = relationship(
        "ProfileReview",
        foreign_keys="ProfileReview.reviewer_id",
        back_populates="reviewer",
    )
    reviews_received = relationship(
        "ProfileReview",
        foreign_keys="ProfileReview.reviewee_id",
        back_populates="reviewee",
    )

class ProfileReview(Base):
    __tablename__ = "profile_reviews"
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_written")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
    __table_args__ = (
        UniqueConstraint("reviewer_id", "reviewee_id", name="unique_profile_review_pair"),
    )


class RentalApplication(Base):
    __tablename__ = "rental_applications"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    landlord_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    move_in_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    listing = relationship("Listing", back_populates="applications")
    tenant = relationship("User", foreign_keys=[tenant_id])
    landlord = relationship("User", foreign_keys=[landlord_id])
    tours = relationship("TourRequest", back_populates="application", cascade="all, delete-orphan")


class TourRequest(Base):
    __tablename__ = "tour_requests"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("rental_applications.id", ondelete="CASCADE"), nullable=False)
    proposed_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    application = relationship("RentalApplication", back_populates="tours")
    proposed_by = relationship("User")


class ListingOccupant(Base):
    __tablename__ = "listing_occupants"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("rental_applications.id", ondelete="SET NULL"), nullable=True)
    move_in_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    listing = relationship("Listing", back_populates="occupants")
    user = relationship("User")


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
    neighborhood_profile = Column(JSON, nullable=True, default=list)
    amenities = Column(JSON, nullable=False, default=[])
    building_features = Column(JSON, nullable=False, default=[])
    custom_tags = Column(JSON, nullable=True, default=list)
    pets_allowed = Column(Boolean, default=True)
    lease_length = Column(Integer, nullable=True)
    images = Column(JSON, nullable=True, default=[])
    sqft = Column(Integer, nullable=True)
    house_rules = Column(JSON, nullable=True, default=[])
    tenant_preferences = Column(JSON, nullable=False, default=[])
    tenant_custom_requirements = Column(JSON, nullable=False, default=[])
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    landlord = relationship("User", back_populates="listings")
    matches = relationship("DailyMatch", back_populates="listing")
    visit_requests = relationship("VisitRequest", back_populates="listing")
    applications = relationship("RentalApplication", back_populates="listing")
    occupants = relationship("ListingOccupant", back_populates="listing")

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
    household_size = Column(Integer, default=1)
    locations = Column(JSON)
    move_in_date = Column(String)
    lease_length = Column(Integer)
    amenities = Column(JSON)
    building_amenities = Column(JSON, default=list)
    pets_allowed = Column(Boolean, default=False)
    smoking_preference = Column(String(32), nullable=True)
    noise_tolerance = Column(String(32), nullable=True)
    visitor_flexibility = Column(String(32), nullable=True)
    custom_preferences = Column(JSON, default=list)
    user = relationship("User", back_populates="renter_preferences")

class LandlordPreferences(Base):
    __tablename__ = "landlord_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    tenant_preferences = Column(JSON, nullable=False, default=[])
    lease_length = Column(Integer, nullable=True)
    pets_allowed = Column(Boolean, default=True)
    custom_requirements = Column(JSON, default=list)
    user = relationship("User", back_populates="landlord_preferences")

class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    balance = Column(Integer, nullable=False, default=0)
    user = relationship("User", back_populates="tokens")


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

class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(64), nullable=False)
    tx_hash = Column(String(128), nullable=False, unique=True)
    status = Column(String(32), default="pending")
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")
    listing = relationship("Listing")

class PaymentRecord(Base):
    __tablename__ = "payment_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String(8), nullable=False, default="usd")
    description = Column(String(255), nullable=True)
    provider = Column(String(64), nullable=False, default="402pay")
    provider_reference = Column(String(255), nullable=True)
    status = Column(String(32), nullable=False, default="pending")
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User")
    listing = relationship("Listing")

class DailyMatch(Base):
    __tablename__ = "daily_matches"
    id = Column(Integer, primary_key=True, index=True)
    renter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    compatibility_score = Column(Float, nullable=False)
    matched_date = Column(Date, nullable=False, index=True)
    renter = relationship("User")
    listing = relationship("Listing", back_populates="matches")
