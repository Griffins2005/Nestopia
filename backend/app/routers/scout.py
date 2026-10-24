from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.db.models import Listing
from app.dependencies import get_db
from app.services.inventory import parse_availability
from app.services.scout import parse_scout_text, run_scout
from sqlalchemy.orm import Session, joinedload

router = APIRouter(prefix="/api/scout", tags=["scout"])


class ScoutIn(BaseModel):
    query: Optional[str] = None
    max_rent: Optional[int] = None
    location: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    semester_alternatives: Optional[bool] = None

    class Config:
        extra = "ignore"


def _require_date(value: Optional[str], field: str):
    if value is None:
        return None
    parsed = parse_availability(value)
    if parsed is None:
        raise HTTPException(status_code=400, detail=f"{field} must be YYYY-MM-DD")
    return parsed


@router.post("")
def scout_listings(payload: ScoutIn, db: Session = Depends(get_db)):
    parsed = parse_scout_text(payload.query or "")
    if payload.max_rent is not None:
        if payload.max_rent < 0:
            raise HTTPException(status_code=400, detail="max_rent cannot be negative")
        parsed.max_rent = payload.max_rent
    if payload.location:
        parsed.location = payload.location.strip()
    if payload.start is not None:
        parsed.start = _require_date(payload.start, "start")
    if payload.end is not None:
        parsed.end = _require_date(payload.end, "end")
    if payload.semester_alternatives is not None:
        parsed.semester_alternatives = payload.semester_alternatives
    if parsed.start and parsed.end and parsed.end <= parsed.start:
        raise HTTPException(status_code=400, detail="end must be after start")
    if parsed.max_rent is None and not parsed.location and not parsed.start:
        raise HTTPException(
            status_code=400,
            detail="Provide a search with a budget, a place, or a date window",
        )

    listings = db.query(Listing).options(joinedload(Listing.landlord)).all()
    return run_scout(listings, parsed)
