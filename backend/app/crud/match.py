# app/crud/crud_match.py
from sqlalchemy.orm import Session
#from app.db.models import DailyMatch

def get_ranked_matches(db, user):
    listings = db.query(Listing).all()
    def rank(listing):
        score = 0
        if listing.budget <= user.preferences.budget:
            score += 5
        if listing.location == user.preferences.location:
            score += 4
        # ... other criteria ...
        return score
    ranked = sorted(listings, key=rank, reverse=True)
    return ranked[:10]