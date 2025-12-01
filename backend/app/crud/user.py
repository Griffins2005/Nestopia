#app/crud/user.py
from sqlalchemy.orm import Session
from app.db.models import User, RenterPreferences, LandlordPreferences, Token as TokenModel
from app.core.security import get_password_hash, verify_password

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email_and_role(db: Session, email: str, role: str):
    return db.query(User).filter_by(email=email, role=role).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password: str, role: str, method="email"):
    hashed = get_password_hash(password) if method == "email" else None
    user = User(email=email, password_hash=hashed, role=role, auth_method=method)
    db.add(user)
    db.commit()
    db.refresh(user)
    token_row = TokenModel(user_id=user.id, balance=0)
    db.add(token_row)
    db.commit()
    return user

def create_google_user(db: Session, email: str, role: str):
    existing = get_user_by_email_and_role(db, email, role)
    if existing:
        if existing.auth_method == "email":
            return "email_only"
        return existing
    user = create_user(db, email, None, role, method="google")
    return user

def authenticate_user(db: Session, email: str, password: str, role: str):
    user = get_user_by_email_and_role(db, email, role)
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
    prefs.tenant_preferences = data.get("tenant_preferences", [])
    prefs.lease_length = data.get("lease_length")
    prefs.pets_allowed = data.get("pets_allowed", True)
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


def set_user_password(db: Session, user: User, new_password: str) -> User:
    user.password_hash = get_password_hash(new_password)
    if user.auth_method != "google":
        user.auth_method = "email"
    db.add(user)
    db.commit()
    db.refresh(user)
    return user