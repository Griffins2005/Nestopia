# app/routers/matches.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user, get_db
from app.crud.match import get_ranked_matches

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.get("/daily")
def daily_matches(db=Depends(get_db), user=Depends(get_current_user)):
    return get_ranked_matches(db, user)
