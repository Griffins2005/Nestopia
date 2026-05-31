#app/routers/listing.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from uuid import uuid4

from app.schemas.listing import ListingCreate, ListingUpdate, SavedListingResponse
from app.crud.listings import (
    create_listing,
    get_all_listings,
    get_listings_by_landlord,
    update_listing,
    delete_listing,
    get_saved_listings_by_user_full,
    save_listing,
    remove_saved_listing,
)
from app.dependencies import get_db, get_current_user, get_optional_user
from app.crud.preferences import get_renter_preferences
from app.utils.match import compute_compatibility_score, compute_compatibility_breakdown
from app.utils.listing_helpers import serialize_listing, normalize_listing_input, validate_listing_images
from app.utils.application_helpers import get_tenant_homes

router = APIRouter(prefix="/api/listings", tags=["Listings"])


@router.post("/")
def create_listing_endpoint(
    request: ListingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "landlord":
        raise HTTPException(status_code=403, detail="Not a landlord")
    payload = normalize_listing_input(request.dict(exclude_unset=True))
    validate_listing_images(payload)
    return create_listing(db, current_user.id, payload)


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


@router.get("")
@router.get("/")
def read_all_listings(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
    view_as_renter: bool = Query(False, description="For landlords: view all listings as a renter would"),
):
    if current_user and current_user.role == "landlord" and not view_as_renter:
        listings = get_listings_by_landlord(db, current_user.id)
    else:
        listings = get_all_listings(db)

    renter_prefs = None
    if current_user and (current_user.role == "renter" or (current_user.role == "landlord" and view_as_renter)):
        renter_prefs = get_renter_preferences(db, current_user.id)

    results = []
    for listing in listings:
        score = None
        breakdown = None
        if renter_prefs:
            breakdown = compute_compatibility_breakdown(renter_prefs, None, listing)
            score = breakdown["overall"]
        results.append(serialize_listing(listing, match_score=score, match_breakdown=breakdown))
    return results


@router.get("/owned")
def get_owned_listings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "landlord":
        raise HTTPException(status_code=403, detail="Not a landlord")
    listings = get_listings_by_landlord(db, current_user.id)
    return [serialize_listing(l) for l in listings]


@router.get("/tenant-homes")
def get_tenant_home_listings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "renter":
        raise HTTPException(status_code=403, detail="Not a tenant")
    return get_tenant_homes(db, current_user)


@router.get("/saved/")
def list_saved_listings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_saved_listings_by_user_full(db, current_user.id)


@router.post("/saved/{listing_id}", response_model=SavedListingResponse)
def add_saved_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return save_listing(db, current_user.id, listing_id)


@router.delete("/saved/{listing_id}", response_model=SavedListingResponse)
def delete_saved_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    removed = remove_saved_listing(db, current_user.id, listing_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Saved listing not found")
    return removed


@router.get("/{listing_id}")
def read_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    from app.db.models import Listing
    from sqlalchemy.orm import joinedload

    listing = (
        db.query(Listing)
        .options(joinedload(Listing.landlord))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    score = None
    breakdown = None
    if current_user and current_user.role == "renter":
        renter_prefs = get_renter_preferences(db, current_user.id)
        if renter_prefs:
            breakdown = compute_compatibility_breakdown(renter_prefs, None, listing)
            score = breakdown["overall"]
    return serialize_listing(listing, match_score=score, match_breakdown=breakdown)


@router.put("/{listing_id}")
def update_listing_endpoint(
    listing_id: int,
    request: ListingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.db.models import Listing

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing or listing.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized or listing not found")
    raw = request.dict(exclude_unset=True)
    if "images" in raw:
        validate_listing_images({"images": raw.get("images") or []})
    return update_listing(db, listing_id, raw)


@router.delete("/{listing_id}")
def delete_listing_endpoint(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.db.models import Listing

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing or listing.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized or listing not found")
    return delete_listing(db, listing_id)
