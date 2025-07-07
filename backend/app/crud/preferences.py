# app/crud/preferences.py
from sqlalchemy.orm import Session
from app.db.models import RenterPreferences, LandlordPreferences

def get_renter_preferences(db: Session, user_id: int):
    return db.query(RenterPreferences).filter(RenterPreferences.user_id == user_id).first()

def set_renter_preferences(db: Session, user_id: int, prefs_data: dict):
    existing = get_renter_preferences(db, user_id)
    if existing:
        for key, val in prefs_data.items():
            setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return existing
    new_pref = RenterPreferences(user_id=user_id, **prefs_data)
    db.add(new_pref)
    db.commit()
    db.refresh(new_pref)
    return new_pref

def get_landlord_preferences(db: Session, user_id: int):
    return db.query(LandlordPreferences).filter(LandlordPreferences.user_id == user_id).first()

def set_landlord_preferences(db: Session, user_id: int, prefs_data: dict):
    existing = get_landlord_preferences(db, user_id)
    if existing:
        for key, val in prefs_data.items():
            setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return existing
    new_pref = LandlordPreferences(user_id=user_id, **prefs_data)
    db.add(new_pref)
    db.commit()
    db.refresh(new_pref)
    return new_pref
