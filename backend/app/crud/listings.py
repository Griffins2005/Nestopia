# app/crud/listings.py
from sqlalchemy.orm import Session, joinedload
from app.db.models import Listing, SavedListing
from app.schemas.listing import ListingResponse, LandlordOut
from datetime import datetime

def get_listing(db: Session, listing_id: int):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        return None
    # Attach nested landlord details
    landlord = listing.landlord
    landlord_data = {
        "id": landlord.id,
        "name": landlord.name or "",
        "avatar": landlord.profilePicture or "",
        "email": landlord.email or "",
        "created_at": landlord.created_at
    }
    data = ListingResponse.from_orm(listing).dict()
    data['landlord'] = landlord_data
    return data

def get_all_listings(db: Session):
    return (
        db.query(Listing)
        .options(joinedload(Listing.landlord))
        .all()
    )

def get_listings_by_landlord(db: Session, landlord_id: int):
    return (
        db.query(Listing)
        .options(joinedload(Listing.landlord))
        .filter(Listing.landlord_id == landlord_id)
        .all()
    )

def create_listing(db: Session, landlord_id: int, listing_data: dict):
    new_listing = Listing(landlord_id=landlord_id, **listing_data)
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing

def update_listing(db: Session, listing_id: int, updates: dict):
    listing = get_listing(db, listing_id)
    if not listing:
        return None
    for key, val in updates.items():
        if val is not None:
            setattr(listing, key, val)
    db.commit()
    db.refresh(listing)
    return listing

def delete_listing(db: Session, listing_id: int):
    db.query(SavedListing).filter(SavedListing.listing_id == listing_id).delete()
    db.commit()
    listing = get_listing(db, listing_id)
    if listing:
        db.delete(listing)
        db.commit()
    return listing

def get_saved_listings_by_user(db: Session, user_id: int):
    return db.query(SavedListing).filter(SavedListing.user_id == user_id).all()

def save_listing(db: Session, user_id: int, listing_id: int):
    db_saved = SavedListing(user_id=user_id, listing_id=listing_id)
    db.add(db_saved)
    db.commit()
    db.refresh(db_saved)
    return db_saved

def remove_saved_listing(db: Session, user_id: int, listing_id: int):
    db_saved = db.query(SavedListing).filter(
        SavedListing.user_id == user_id,
        SavedListing.listing_id == listing_id
    ).first()
    if db_saved:
        db.delete(db_saved)
        db.commit()
    return db_saved

def get_saved_listings_by_user_full(db: Session, user_id: int):
    results = (
        db.query(SavedListing, Listing)
        .join(Listing, SavedListing.listing_id == Listing.id)
        .options(joinedload(SavedListing.listing).joinedload(Listing.landlord))
        .filter(SavedListing.user_id == user_id)
        .all()
    )
    return [
        {
            "id": saved.id,
            "user_id": saved.user_id,
            "saved_at": saved.saved_at,
            "listing": ListingResponse.from_orm(listing)
        }
        for saved, listing in results
    ]
