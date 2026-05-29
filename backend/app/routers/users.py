#app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Body
from sqlalchemy.orm import Session, joinedload
from app.db.models import RenterPreferences, LandlordPreferences, User, ProfileReview
from app.schemas.user import UserResponse, UserUpdateIn, RenterPreferencesIn, LandlordPreferencesIn, RenterPreferencesOut, LandlordPreferencesOut
from app.schemas.profile import PublicProfileOut, ProfileReviewIn
from app.utils.profile_helpers import build_public_profile, create_profile_review, normalize_contact_preference, CONTACT_PREFERENCES
from app.core.security import verify_password, get_password_hash
from app.core.password_policy import validate_password_strength
from app.crud.user import get_user_by_id, link_wallet_address, save_renter_preferences, save_landlord_preferences
from app.dependencies import get_db, get_current_user
import os
from uuid import uuid4
from fastapi.responses import JSONResponse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = str(BASE_DIR / "uploads")
PROFILE_PICS_DIR = os.path.join(UPLOAD_DIR, "profile_pics")
os.makedirs(PROFILE_PICS_DIR, exist_ok=True)

router = APIRouter(prefix="/api/users", tags=["users"])

CONTACT_PREFERENCES = {"email", "phone", "text"}


def _validate_contact_preference(user, data: dict) -> None:
    pref = data.get("contact_preference")
    if pref is None:
        return
    if pref not in CONTACT_PREFERENCES:
        raise HTTPException(
            status_code=400,
            detail="contact_preference must be email, phone, or text.",
        )
    phone = (data.get("phone") if "phone" in data else user.phone or "").strip()
    if pref in {"phone", "text"} and not phone:
        raise HTTPException(
            status_code=400,
            detail="Add a phone number before choosing call or text as your preferred contact.",
        )


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user=Depends(get_current_user)):
    return current_user


@router.get("/profile/{user_id}", response_model=PublicProfileOut)
def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Profile not found")
    return build_public_profile(target, current_user, db)

    db.refresh(current_user)
@router.post("/profile/{user_id}/reviews", response_model=PublicProfileOut)
def submit_profile_review(
    user_id: int,
    payload: ProfileReviewIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Profile not found")
    create_profile_review(db, current_user, user_id, payload.rating, payload.body)
    db.refresh(target)
    return build_public_profile(target, current_user, db)


    return current_user

@router.post("/upload-profile-doc")
def upload_profile_doc(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4().hex}{ext}"
    fpath = os.path.join(PROFILE_PICS_DIR, fname)
    with open(fpath, "wb") as f:
        f.write(file.file.read())
    file_url = f"/static/profile_pics/{fname}"
    return JSONResponse({"file_url": file_url})

@router.post("/change-password")
def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.auth_method == "google" and not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google sign-in. Manage your password in Google.",
        )
    if not current_user.password_hash or not verify_password(
        current_password, current_user.password_hash
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    try:
        validate_password_strength(new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"msg": "Password changed"}

@router.post("/link-wallet", response_model=UserResponse)
def link_wallet(request: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    wallet_address = request.get("wallet_address")
    if not wallet_address:
        raise HTTPException(status_code=400, detail="No wallet_address provided")
    updated = link_wallet_address(db, current_user, wallet_address)
    return updated

#PREFERENCES ENDPOINTS

@router.post("/preferences/renter", response_model=RenterPreferencesOut)
def set_renter_prefs(
    prefs: RenterPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return save_renter_preferences(db, current_user.id, prefs.dict())

@router.get("/preferences/renter", response_model=RenterPreferencesOut)
def get_renter_prefs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prefs = db.query(RenterPreferences).filter_by(user_id=current_user.id).first()
    if not prefs:
        raise HTTPException(404, "No preferences found")
    return prefs

@router.post("/preferences/landlord", response_model=LandlordPreferencesOut)
def set_landlord_prefs(
    prefs: LandlordPreferencesIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return save_landlord_preferences(db, current_user.id, prefs.dict())

@router.get("/preferences/landlord", response_model=LandlordPreferencesOut)
def get_landlord_prefs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prefs = db.query(LandlordPreferences).filter_by(user_id=current_user.id).first()
    if not prefs:
        raise HTTPException(404, "No preferences found")
    return prefs
