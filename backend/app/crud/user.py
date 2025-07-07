# app/crud/user.py
from sqlalchemy.orm import Session
from app.db.models import User, RenterPreferences, LandlordPreferences
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, email: str, password: str, role: str):
    hashed = get_password_hash(password)
    new_user = User(email=email, password_hash=hashed, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token_row = Token(user_id=new_user.id, balance=0)
    db.add(token_row)
    db.commit()
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

def link_wallet_address(db: Session, user: User, wallet_address: str):
    user.wallet_address = wallet_address
    db.commit()
    db.refresh(user)
    return user

def save_renter_preferences(db, user_id, data):
    prefs = db.query(RenterPreferences).filter_by(user_id=user_id).first()
    if not prefs:
        prefs = RenterPreferences(user_id=user_id)
    prefs.budget_min = data["budget_min"]
    prefs.budget_max = data["budget_max"]
    prefs.bedrooms = data["bedrooms"]
    prefs.bathrooms = data["bathrooms"]
    prefs.locations = data["locations"]
    prefs.move_in_date = data["move_in_date"]
    prefs.lease_length = data["lease_length"]
    prefs.amenities = data["amenities"]
    prefs.pets_allowed = data["pets_allowed"]
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs

def save_landlord_preferences(db, user_id, data):
    prefs = db.query(LandlordPreferences).filter_by(user_id=user_id).first()
    if not prefs:
        prefs = LandlordPreferences(user_id=user_id)
    # Only update tenant_preferences, lease_length, pets_allowed
    prefs.tenant_preferences = data.get("tenant_preferences", [])
    prefs.lease_length = data.get("lease_length")
    prefs.pets_allowed = data.get("pets_allowed", True)
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs