# app/services/matching.py
from datetime import date

from celery_app import celery
from sqlalchemy.orm import Session

from app.crud.match import create_daily_match, delete_matches_for_date
from app.db.models import LandlordPreferences, Listing, RenterPreferences
from app.db.session import SessionLocal
from app.core.config import settings
from app.utils.match import compute_compatibility_score
from app.utils.ml_match import SmartMatcher, compute_user_behavior_features, find_similar_users


# Initialize smart matcher (can be configured via env vars)
USE_ML_MATCHING = settings.USE_ML_MATCHING
USE_SEMANTIC = settings.USE_SEMANTIC_MATCHING

smart_matcher = SmartMatcher(use_semantic=USE_SEMANTIC) if USE_ML_MATCHING else None


@celery.task
def compute_daily_matches():
    """
    Compute daily matches using AI-enhanced matching if enabled,
    otherwise falls back to rule-based scoring.
    """
    db: Session = SessionLocal()
    today = date.today()

    delete_matches_for_date(db, today)

    renters = db.query(RenterPreferences).all()
    listings = db.query(Listing).all()

    landlord_pref_map = {
        lp.user_id: lp for lp in db.query(LandlordPreferences).all()
    }

    for renter_pref in renters:
        ranked = []
        
        # Pre-compute similar users for collaborative filtering (if ML enabled)
        similar_users_data = None
        if smart_matcher:
            similar_users = find_similar_users(db, renter_pref, limit=10)
            similar_users_data = []
            for su in similar_users:
                for listing_id in su.get('saved_listing_ids', []):
                    similar_users_data.append({'saved_listing_id': listing_id})
        
        for listing in listings:
            landlord_pref = landlord_pref_map.get(listing.landlord_id)
            
            if smart_matcher:
                # AI-enhanced matching
                user_behavior = compute_user_behavior_features(
                    db, renter_pref.user_id, listing.id
                )
                
                score, explanation = smart_matcher.compute_enhanced_score(
                    renter_pref,
                    landlord_pref,
                    listing,
                    user_behavior=user_behavior,
                    similar_users_prefs=similar_users_data
                )
            else:
                # Fallback to rule-based
                score = compute_compatibility_score(renter_pref, landlord_pref, listing)
                explanation = {"base_score": score}
            
            ranked.append((listing.id, score, explanation))
        
        # Sort by score
        ranked.sort(key=lambda item: item[1], reverse=True)
        
        # Store top 3 matches (can be configurable)
        for listing_id, score, explanation in ranked[:3]:
            create_daily_match(
                db,
                renter_pref.user_id,
                listing_id,
                float(score),
                today,
            )
    
    db.close()
