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
    get_renter_preferences,
    set_renter_preferences,
    get_landlord_preferences,
    set_landlord_preferences,
)
from app.utils.preferences_helpers import (
    normalize_renter_prefs,
    normalize_landlord_prefs,
    renter_prefs_for_frontend,
)

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


@router.get("/renter")
def fetch_renter_prefs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prefs = get_renter_preferences(db, current_user.id)
    if not prefs:
        return {}
    return renter_prefs_for_frontend(prefs)


@router.post("/renter", response_model=RenterPreferencesOut)
def save_renter_prefs(
    prefs: RenterPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payload = normalize_renter_prefs(prefs.dict())
    updated = set_renter_preferences(db, current_user.id, payload)
    return updated


@router.get("/landlord")
def fetch_landlord_prefs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prefs = get_landlord_preferences(db, current_user.id)
    if not prefs:
        return {}
    return prefs


@router.post("/landlord", response_model=LandlordPreferencesOut)
def save_landlord_prefs(
    prefs: LandlordPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payload = normalize_landlord_prefs(prefs.dict())
    updated = set_landlord_preferences(db, current_user.id, payload)
    return updated
