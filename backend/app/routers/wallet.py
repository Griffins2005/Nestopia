from fastapi import APIRouter, Depends
from app.dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

@router.post("/connect")
def connect_wallet(address: str, user = Depends(get_current_user)):
    # Save wallet address to user (update user in DB)
    # ...
    return {"message": "Wallet connected", "address": address}
