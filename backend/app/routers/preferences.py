# app/routers/preferences.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.user import (
    RenterPreferencesIn,
    RenterPreferencesOut,
    LandlordPreferencesIn,
    LandlordPreferencesOut,
)
from app.crud.preferences import (
    get_renter_preferences, set_renter_preferences,
    get_landlord_preferences, set_landlord_preferences
)

router = APIRouter(prefix="/api/preferences", tags=["preferences"])

@router.get("/renter", response_model=RenterPreferencesOut)
def fetch_renter_prefs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prefs = get_renter_preferences(db, current_user.id)
    if not prefs:
        raise HTTPException(404, "No preferences found")
    return prefs

@router.post("/renter", response_model=RenterPreferencesOut)
def save_renter_prefs(
    prefs: RenterPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    updated = set_renter_preferences(db, current_user.id, prefs.dict())
    return updated

@router.get("/landlord", response_model=LandlordPreferencesOut)
def fetch_landlord_prefs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prefs = get_landlord_preferences(db, current_user.id)
    if not prefs:
        raise HTTPException(404, "No preferences found")
    return prefs

@router.post("/landlord", response_model=LandlordPreferencesOut)
def save_landlord_prefs(
    prefs: LandlordPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    updated = set_landlord_preferences(db, current_user.id, prefs.dict())
    return updated
