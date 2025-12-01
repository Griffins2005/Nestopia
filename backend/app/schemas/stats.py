from pydantic import BaseModel
from typing import Optional


class StatsSummary(BaseModel):
    total_users: int
    total_listings: int
    total_matches: int
    avg_visit_lead_hours: Optional[float] = None


