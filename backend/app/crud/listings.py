# app/crud/listings.py
from sqlalchemy.orm import Session, joinedload
from app.db.models import Listing, SavedListing
from app.utils.listing_helpers import normalize_listing_input, serialize_listing


def get_listing(db: Session, listing_id: int):
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.landlord))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        return None
    return serialize_listing(listing)


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
    payload = normalize_listing_input(listing_data)
    new_listing = Listing(landlord_id=landlord_id, **payload)
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    db.refresh(new_listing, attribute_names=["landlord"])
    return serialize_listing(new_listing)


def update_listing(db: Session, listing_id: int, updates: dict):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        return None
    payload = normalize_listing_input({**updates, "location": updates.get("location") or listing.location})
    for key, val in payload.items():
        if val is not None:
            setattr(listing, key, val)
    db.commit()
    db.refresh(listing)
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.landlord))
        .filter(Listing.id == listing_id)
        .first()
    )
    return serialize_listing(listing)


def delete_listing(db: Session, listing_id: int):
    db.query(SavedListing).filter(SavedListing.listing_id == listing_id).delete()
    db.commit()
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing:
        db.delete(listing)
        db.commit()
    return {"id": listing_id}


def get_saved_listings_by_user(db: Session, user_id: int):
    return db.query(SavedListing).filter(SavedListing.user_id == user_id).all()


def save_listing(db: Session, user_id: int, listing_id: int):
    existing = db.query(SavedListing).filter(
        SavedListing.user_id == user_id,
        SavedListing.listing_id == listing_id,
    ).first()
    if existing:
        return existing
    db_saved = SavedListing(user_id=user_id, listing_id=listing_id)
    db.add(db_saved)
    db.commit()
    db.refresh(db_saved)
    return db_saved


def remove_saved_listing(db: Session, user_id: int, listing_id: int):
    db_saved = db.query(SavedListing).filter(
        SavedListing.user_id == user_id,
        SavedListing.listing_id == listing_id,
    ).first()
    if db_saved:
        db.delete(db_saved)
        db.commit()
    return db_saved


def get_saved_listings_by_user_full(db: Session, user_id: int):
    results = (
        db.query(SavedListing)
        .options(joinedload(SavedListing.listing).joinedload(Listing.landlord))
        .filter(SavedListing.user_id == user_id)
        .order_by(SavedListing.saved_at.desc())
        .all()
    )
    out = []
    for saved in results:
        listing = saved.listing
        if not listing:
            continue
        data = serialize_listing(listing)
        data["saved_at"] = saved.saved_at
        out.append(data)
    return out
