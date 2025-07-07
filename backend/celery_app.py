# celery_app.py
from celery import Celery
from app.core.config import settings

celery = Celery(
    __name__,
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.beat_schedule = {
    "compute-daily-matches": {
        "task": "app.services.matching.compute_daily_matches",
        "schedule": 60 * 60 * 24,  # every 24 hours
        # Or use crontab: "schedule": crontab(hour=2, minute=0)
    },
}
celery.conf.timezone = "UTC"
