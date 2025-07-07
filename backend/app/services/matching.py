# app/services/matching.py
from celery_app import celery
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.crud.crud_match import create_daily_match, delete_matches_for_date
from app.crud.crud_preferences import get_renter_preferences
from app.crud.crud_listing import get_all_listings
from datetime import date

@celery.task
def compute_daily_matches():
    db: Session = SessionLocal()
    today = date.today()

    # 1. Clear any existing matches for today (if re-running)
    delete_matches_for_date(db, today)

    # 2. Fetch all renters who have preferences
    renters = db.query(get_renter_preferences).all()  # placeholder; fix below
    # Actually:
    from app.db.models import RenterPreferences
    renters = db.query(RenterPreferences).all()

    # 3. Fetch all listings
    from app.db.models import Listing
    listings = db.query(Listing).all()

    def compatibility_score(renter_pref, listing):
        score = 0
        price_diff = abs(renter_pref.max_rent - listing.rent_price)
        score += max(0, 100 - price_diff) * 0.4
        if renter_pref.desired_location.lower() in listing.location.lower():
            score += 40
        if renter_pref.pets_allowed and "no pets" in listing.description.lower():
            score -= 20
        else:
            score += 20
        return max(score, 0)

    for renter_pref in renters:
        scores = []
        for listing in listings:
            score = compatibility_score(renter_pref, listing)
            scores.append((listing.id, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        top3 = scores[:3]
        for listing_id, score in top3:
            create_daily_match(db, renter_pref.user_id, listing_id, score, today)

    db.close()
