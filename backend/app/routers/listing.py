#app/routers/listing.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
from uuid import uuid4
from app.schemas.listing import ( ListingCreate, ListingResponse,ListingUpdate,SavedListingResponse, SavedListingWithDetails )
from app.crud.listings import (create_listing, get_all_listings, get_listing, get_listings_by_landlord, update_listing,
    delete_listing, get_saved_listings_by_user_full, save_listing, remove_saved_listing )
from app.dependencies import get_db, get_current_user, get_optional_user
from app.crud.preferences import get_renter_preferences, get_landlord_preferences
from app.utils.match import compute_compatibility_score

router = APIRouter(prefix="/api/listings", tags=["Listings"])

@router.post("/", response_model=ListingResponse)
def create_listing_endpoint(
    request: ListingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "landlord":
        raise HTTPException(status_code=403, detail="Not a landlord")
    new_listing = create_listing(db, current_user.id, request.dict())
    return new_listing

@router.post("/upload-image")
def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if current_user.role != "landlord":
        raise HTTPException(status_code=403, detail="Not a landlord")
    UPLOAD_DIR = "uploads/listing_images"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4().hex}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        f.write(file.file.read())
    url = f"/static/listing_images/{fname}"
    return JSONResponse({"url": url})

@router.get("", response_model=List[ListingResponse])
@router.get("/", response_model=List[ListingResponse])
def read_all_listings(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
    view_as_renter: bool = Query(False, description="For landlords: view all listings as a renter would")
):
    """
    Get all listings. 
    - Unauthenticated users: see all listings without match scores
    - Landlords: see their own listings by default, or all listings if view_as_renter=True
    - Renters: see all listings with match scores
    """
    # If landlord and not viewing as renter, show only their listings
    if current_user and current_user.role == "landlord" and not view_as_renter:
        return get_listings_by_landlord(db, current_user.id)
    
    # Otherwise, show all listings (for renters, unauthenticated users, or landlords viewing as renters)
    listings = get_all_listings(db)
    results = []
    
    # Only calculate match scores if user is authenticated and is/wants to be treated as renter
    renter_prefs = None
    if current_user and (current_user.role == "renter" or (current_user.role == "landlord" and view_as_renter)):
        renter_prefs = get_renter_preferences(db, current_user.id)
    
    for listing in listings:
        landlord_prefs = get_landlord_preferences(db, listing.landlord_id)
        data = ListingResponse.from_orm(listing).dict()
        
        if renter_prefs:
            score = compute_compatibility_score(renter_prefs, landlord_prefs, listing)
            data["match_score"] = score
        else:
            data["match_score"] = None
        results.append(data)
    return results

@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing_endpoint(
    listing_id: int,
    request: ListingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = get_listing(db, listing_id)
    if not listing or listing.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized or listing not found")
    updated = update_listing(db, listing_id, request.dict(exclude_unset=True))
    return updated

@router.delete("/{listing_id}", response_model=ListingResponse)
def delete_listing_endpoint(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = get_listing(db, listing_id)
    if not listing or listing.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized or listing not found")
    deleted = delete_listing(db, listing_id)
    return deleted

@router.get("/owned", response_model=List[ListingResponse])
def get_owned_listings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "landlord":
        raise HTTPException(status_code=403, detail="Not a landlord")
    return get_listings_by_landlord(db, current_user.id)

@router.get("/{listing_id}", response_model=ListingResponse)
def read_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

@router.get("/saved/", response_model=List[SavedListingWithDetails])
def list_saved_listings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_saved_listings_by_user_full(db, current_user.id)

@router.post("/saved/{listing_id}", response_model=SavedListingResponse)
def add_saved_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return save_listing(db, current_user.id, listing_id)

@router.delete("/saved/{listing_id}", response_model=SavedListingResponse)
def delete_saved_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    removed = remove_saved_listing(db, current_user.id, listing_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Saved listing not found")
    return removed