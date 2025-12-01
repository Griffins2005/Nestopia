# app/crud/crud_match.py
from sqlalchemy.orm import Session
from datetime import date
from app.db.models import DailyMatch, Listing, RenterPreferences
from app.schemas.match import MatchResponse

def get_ranked_matches(db: Session, user):
    """Get daily matches for a user, ranked by compatibility score."""
    today = date.today()
    matches = db.query(DailyMatch).filter(
        DailyMatch.renter_id == user.id,
        DailyMatch.matched_date == today
    ).order_by(DailyMatch.compatibility_score.desc()).all()
    
    # Join with listings to get full details
    ranked = []
    for match in matches:
        listing = db.query(Listing).filter(Listing.id == match.listing_id).first()
        if listing:
            ranked.append({
                "listing_id": listing.id,
                "title": listing.title,
                "location": listing.location,
                "rent_price": listing.rent_price,
                "compatibility_score": match.compatibility_score
            })
    
    return ranked[:10]

def create_daily_match(
    db: Session,
    renter_id: int,
    listing_id: int,
    compatibility_score: float,
    matched_date: date
):
    """Create a daily match record."""
    match = DailyMatch(
        renter_id=renter_id,
        listing_id=listing_id,
        compatibility_score=compatibility_score,
        matched_date=matched_date
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match

def delete_matches_for_date(db: Session, matched_date: date):
    """Delete all matches for a specific date (used when recomputing)."""
    db.query(DailyMatch).filter(DailyMatch.matched_date == matched_date).delete()
    db.commit()