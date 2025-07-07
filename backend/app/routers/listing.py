#app/routers/listing.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
from uuid import uuid4
from app.schemas.listing import ( ListingCreate, ListingResponse,ListingUpdate,SavedListingResponse, SavedListingWithDetails )
from app.crud.listings import (create_listing, get_all_listings, get_listing, get_listings_by_landlord, update_listing,
    delete_listing, get_saved_listings_by_user,  get_saved_listings_by_user_full, save_listing, remove_saved_listing )
from app.dependencies import get_db, get_current_user

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
def upload_image(file: UploadFile = File(...)):
    UPLOAD_DIR = "uploads/listing_images"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4().hex}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        f.write(file.file.read())
    url = f"/static/listing_images/{fname}"
    return JSONResponse({"url": url})

@router.get("/", response_model=List[ListingResponse])
def read_all_listings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user and current_user.role == "landlord":
        return get_listings_by_landlord(db, current_user.id)
    else:
        return get_all_listings(db)

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