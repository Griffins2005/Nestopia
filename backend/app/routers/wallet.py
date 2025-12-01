from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_db
from app.crud.user import link_wallet_address
from app.schemas.wallet import WalletConnectRequest, WalletResponse

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


def _validate_address(address: str) -> str:
    normalized = address.strip()
    if not normalized.startswith("0x") or len(normalized) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet format")
    return normalized.lower()


@router.post("/connect", response_model=WalletResponse)
def connect_wallet(
    payload: WalletConnectRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    address = _validate_address(payload.address)
    updated = link_wallet_address(db, user, address)
    return WalletResponse(address=updated.wallet_address, provider=payload.provider)


@router.get("", response_model=WalletResponse)
def get_wallet(user=Depends(get_current_user)):
    if not user.wallet_address:
        raise HTTPException(status_code=404, detail="No wallet connected")
    return WalletResponse(address=user.wallet_address, provider="custom")
