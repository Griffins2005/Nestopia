# app/schemas/match.py
from pydantic import BaseModel
from typing import List

class MatchResponse(BaseModel):
    listing_id: int
    title: str
    location: str
    rent_price: int
    compatibility_score: float

class DailyMatchesResponse(BaseModel):
    date: str
    matches: List[MatchResponse]
