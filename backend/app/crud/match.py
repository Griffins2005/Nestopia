# app/crud/match.py
from sqlalchemy.orm import Session, joinedload
from datetime import date

from app.db.models import DailyMatch, Listing, RenterPreferences
from app.crud.preferences import get_renter_preferences
from app.utils.match import compute_compatibility_breakdown
from app.utils.listing_helpers import serialize_listing


def _rank_live_matches(db: Session, user, limit: int = 10):
    """Score all listings on the fly when daily matches haven't run yet."""
    renter_prefs = get_renter_preferences(db, user.id)
    if not renter_prefs:
        return []

    listings = db.query(Listing).options(joinedload(Listing.landlord)).all()
    ranked = []
    for listing in listings:
        breakdown = compute_compatibility_breakdown(renter_prefs, None, listing)
        score = breakdown["overall"]
        ranked.append((listing, score, breakdown))

    ranked.sort(key=lambda item: item[1], reverse=True)
    return [
        serialize_listing(listing, match_score=score, match_breakdown=breakdown)
        for listing, score, breakdown in ranked[:limit]
    ]


def get_ranked_matches(db: Session, user):
    """Daily matches when available; otherwise live compatibility ranking."""
    if user.role != "renter":
        return []

    today = date.today()
    matches = (
        db.query(DailyMatch)
        .filter(DailyMatch.renter_id == user.id, DailyMatch.matched_date == today)
        .order_by(DailyMatch.compatibility_score.desc())
        .all()
    )

    if not matches:
        return _rank_live_matches(db, user)

    ranked = []
    for match in matches:
        listing = (
            db.query(Listing)
            .options(joinedload(Listing.landlord))
            .filter(Listing.id == match.listing_id)
            .first()
        )
        if listing:
            renter_prefs = get_renter_preferences(db, user.id)
            breakdown = None
            score = float(match.compatibility_score)
            if renter_prefs:
                breakdown = compute_compatibility_breakdown(renter_prefs, None, listing)
                score = breakdown["overall"]
            ranked.append(
                serialize_listing(
                    listing,
                    match_score=score,
                    match_breakdown=breakdown,
                )
            )
    ranked.sort(key=lambda item: item.get("match_score") or 0, reverse=True)
    return ranked[:10]


def create_daily_match(db: Session, renter_id: int, listing_id: int, compatibility_score: float, matched_date: date):
    match = DailyMatch(
        renter_id=renter_id,
        listing_id=listing_id,
        compatibility_score=compatibility_score,
        matched_date=matched_date,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def delete_matches_for_date(db: Session, matched_date: date):
    db.query(DailyMatch).filter(DailyMatch.matched_date == matched_date).delete()
    db.commit()
