#app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Body
from sqlalchemy.orm import Session
from app.db.models import User
from app.schemas.user import UserResponse, UserUpdateIn
from app.schemas.profile import PublicProfileOut, ProfileReviewIn
from app.utils.profile_helpers import (
    build_public_profile,
    create_profile_review,
    normalize_contact_preference,
    CONTACT_PREFERENCES,
)
from app.core.security import verify_password, get_password_hash
from app.core.password_policy import validate_password_strength
from app.crud.user import link_wallet_address
from app.dependencies import get_db, get_current_user, get_optional_user
from app.core.storage import save_upload
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/users", tags=["users"])


def _validate_contact_preference(user, data: dict) -> None:
    pref = data.get("contact_preference")
    if pref is None:
        return
    normalized = normalize_contact_preference(pref)
    if normalized not in CONTACT_PREFERENCES:
        raise HTTPException(
            status_code=400,
            detail="contact_preference must be any, email, or text.",
        )
    data["contact_preference"] = normalized
    phone = (data.get("phone") if "phone" in data else user.phone or "").strip()
    if normalized == "text" and not phone:
        raise HTTPException(
            status_code=400,
            detail="Add a phone number before choosing text as your preferred contact.",
        )


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    payload: UserUpdateIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    data = payload.dict(exclude_unset=True)
    _validate_contact_preference(current_user, data)
    for key, value in data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/profile/{user_id}", response_model=PublicProfileOut)
def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Profile not found")
    return build_public_profile(target, current_user, db)


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

@router.post("/upload-profile-doc")
def upload_profile_doc(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    file_url = save_upload("profile_pics", file.filename or "photo.jpg", file.file)
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
