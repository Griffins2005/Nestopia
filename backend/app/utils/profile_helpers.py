from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.db.models import ProfileReview, User

CONTACT_PREFERENCES = {"any", "text", "email"}


def normalize_contact_preference(value: Optional[str]) -> str:
    pref = (value or "any").lower()
    if pref == "phone":
        return "text"
    if pref in CONTACT_PREFERENCES:
        return pref
    return "any"


def format_member_since(created_at: Optional[datetime]) -> str:
    if not created_at:
        return "N/A"
    return created_at.strftime("%B %Y")


def _serialize_review(review: ProfileReview) -> dict:
    reviewer = review.reviewer
    role = reviewer.role if reviewer else "renter"
    return {
        "id": review.id,
        "rating": review.rating,
        "body": review.body,
        "created_at": review.created_at,
        "reviewer_name": (reviewer.name if reviewer and reviewer.name else "Member"),
        "reviewer_role": role,
    }


def build_public_profile(user: User, viewer: Optional[User], db: Session) -> dict:
    reviews = (
        db.query(ProfileReview)
        .options(joinedload(ProfileReview.reviewer))
        .filter(ProfileReview.reviewee_id == user.id)
        .order_by(ProfileReview.created_at.desc())
        .all()
    )
    ratings = [r.rating for r in reviews if r.rating]
    rating_avg = round(sum(ratings) / len(ratings), 1) if ratings else None
    is_self = bool(viewer and viewer.id == user.id)
    same_person = bool(
        viewer
        and not is_self
        and viewer.email
        and user.email
        and viewer.email.lower() == user.email.lower()
    )
    can_review = False
    if viewer and not is_self and not same_person:
        already = (
            db.query(ProfileReview.id)
            .filter(
                ProfileReview.reviewer_id == viewer.id,
                ProfileReview.reviewee_id == user.id,
            )
            .first()
        )
        can_review = already is None

    profile = {
        "id": user.id,
        "name": user.name or "Member",
        "role": user.role,
        "profilePicture": user.profilePicture or "",
        "location": user.location or "",
        "about": user.about or "",
        "member_since": format_member_since(user.created_at),
        "rating_avg": rating_avg,
        "rating_count": len(reviews),
        "reviews": [_serialize_review(r) for r in reviews],
        "is_self": is_self,
        "same_person": same_person,
        "can_review": can_review,
    }

    if is_self:
        profile["email"] = user.email
        profile["phone"] = user.phone or ""
        if user.role == "landlord":
            profile["contact_preference"] = normalize_contact_preference(user.contact_preference)
    elif user.role == "landlord":
        profile["contact_preference"] = normalize_contact_preference(user.contact_preference)

    return profile


def create_profile_review(
    db: Session,
    reviewer: User,
    reviewee_id: int,
    rating: int,
    body: str,
) -> ProfileReview:
    from fastapi import HTTPException

    if reviewer.id == reviewee_id:
        raise HTTPException(status_code=400, detail="You can't review yourself.")

    reviewee = db.query(User).filter(User.id == reviewee_id).first()
    if not reviewee:
        raise HTTPException(status_code=404, detail="Profile not found")

    if (
        reviewer.email
        and reviewee.email
        and reviewer.email.lower() == reviewee.email.lower()
    ):
        raise HTTPException(status_code=400, detail="You can't review yourself.")

    existing = (
        db.query(ProfileReview)
        .filter(
            ProfileReview.reviewer_id == reviewer.id,
            ProfileReview.reviewee_id == reviewee_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this member.")

    text = (body or "").strip()
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Review must be at least 10 characters.")

    review = ProfileReview(
        reviewer_id=reviewer.id,
        reviewee_id=reviewee_id,
        rating=rating,
        body=text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
