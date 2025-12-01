from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db import models
from app.db.session import get_db
from app.schemas.stats import StatsSummary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
def get_stats_summary(db: Session = Depends(get_db)) -> StatsSummary:
    total_users = db.query(models.User).count()
    total_listings = db.query(models.Listing).count()
    total_matches = db.query(models.DailyMatch).count()

    visit_rows: List[models.VisitRequest] = (
        db.query(models.VisitRequest.created_at, models.VisitRequest.scheduled_at)
        .filter(models.VisitRequest.scheduled_at.isnot(None))
        .all()
    )

    avg_visit_lead_hours = None
    if visit_rows:
        deltas = [
            (row.scheduled_at - row.created_at).total_seconds()
            for row in visit_rows
            if row.created_at is not None and row.scheduled_at is not None
        ]
        if deltas:
            avg_visit_lead_hours = round((sum(deltas) / len(deltas)) / 3600, 1)

    return StatsSummary(
        total_users=total_users,
        total_listings=total_listings,
        total_matches=total_matches,
        avg_visit_lead_hours=avg_visit_lead_hours,
    )

