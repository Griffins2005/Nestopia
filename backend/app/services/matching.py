# app/services/matching.py
from __future__ import annotations

"""Daily matches.

The score is a hybrid heuristic. Listings over a renter's stated maximum
budget are dropped before scoring. Embeddings, when enabled, are built once
per listing and once per renter.
"""
from collections import defaultdict
from datetime import date
from time import perf_counter

from celery_app import celery
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.match import delete_matches_for_date
from app.db.models import DailyMatch, Listing, RenterPreferences, SavedListing, VisitRequest
from app.db.session import SessionLocal
from app.services.inventory import within_hard_budget
from app.utils.match import compute_compatibility_breakdown
from app.utils.ml_match import (
    HeuristicMatcher,
    behavior_from_cache,
    collaborative_saved_ids,
)


USE_HEURISTIC_MATCHING = settings.USE_ML_MATCHING
USE_SEMANTIC = settings.USE_SEMANTIC_MATCHING

heuristic_matcher = HeuristicMatcher(use_semantic=USE_SEMANTIC) if USE_HEURISTIC_MATCHING else None


def _index_ids(rows) -> dict:
    grouped = defaultdict(set)
    for user_id, listing_id in rows:
        grouped[user_id].add(listing_id)
    return grouped


def run_daily_matches(db: Session, today: date | None = None) -> dict:
    """Score eligible pairs and store the top three for each renter.

    Returns query count and latency for this run.
    """
    today = today or date.today()
    queries = {"n": 0}

    def _count_query(*_args, **_kwargs):
        queries["n"] += 1

    engine = db.get_bind()
    event.listen(engine, "before_cursor_execute", _count_query)
    started = perf_counter()
    scored = 0
    filtered = 0
    stored = 0
    try:
        delete_matches_for_date(db, today)
        renters = db.query(RenterPreferences).all()
        listings = db.query(Listing).all()
        saved_by_user = _index_ids(db.query(SavedListing.user_id, SavedListing.listing_id).all())
        visits_by_user = _index_ids(db.query(VisitRequest.renter_id, VisitRequest.listing_id).all())
        listing_vectors = (
            heuristic_matcher.precompute_listing_embeddings(listings) if heuristic_matcher else {}
        )

        pending = []
        for renter_pref in renters:
            budget_max = getattr(renter_pref, "budget_max", 0) or 0
            candidates = []
            for listing in listings:
                if budget_max and not within_hard_budget(listing, budget_max):
                    filtered += 1
                    continue
                candidates.append(listing)

            renter_vector = (
                heuristic_matcher.precompute_renter_embedding(renter_pref) if heuristic_matcher else None
            )
            saved_ids = saved_by_user.get(renter_pref.user_id, set())
            visit_ids = visits_by_user.get(renter_pref.user_id, set())
            collab_ids = (
                collaborative_saved_ids(renter_pref, renters, saved_by_user)
                if heuristic_matcher
                else set()
            )
            collab_rows = [{"saved_listing_id": listing_id} for listing_id in collab_ids]

            ranked = []
            for listing in candidates:
                scored += 1
                if heuristic_matcher:
                    behavior = behavior_from_cache(saved_ids, visit_ids, listing.id)
                    score, _explanation = heuristic_matcher.compute_enhanced_score(
                        renter_pref,
                        None,
                        listing,
                        user_behavior=behavior,
                        similar_users_prefs=collab_rows or None,
                        listing_vector=listing_vectors.get(listing.id),
                        renter_vector=renter_vector,
                    )
                else:
                    score = compute_compatibility_breakdown(renter_pref, None, listing)["overall"]
                ranked.append((listing.id, score))

            ranked.sort(key=lambda item: item[1], reverse=True)
            for listing_id, score in ranked[:3]:
                pending.append(
                    DailyMatch(
                        renter_id=renter_pref.user_id,
                        listing_id=listing_id,
                        compatibility_score=float(score),
                        matched_date=today,
                    )
                )
                stored += 1

        db.add_all(pending)
        db.commit()
    finally:
        event.remove(engine, "before_cursor_execute", _count_query)

    elapsed_ms = round((perf_counter() - started) * 1000, 3)
    return {
        "matcher": "hybrid_heuristic" if heuristic_matcher else "rule_weights",
        "learned_ranking": False,
        "renters": len(renters) if "renters" in locals() else 0,
        "listings": len(listings) if "listings" in locals() else 0,
        "candidates_scored": scored,
        "candidates_filtered": filtered,
        "stored": stored,
        "queries": queries["n"],
        "elapsed_ms": elapsed_ms,
    }


@celery.task
def compute_daily_matches():
    db: Session = SessionLocal()
    try:
        return run_daily_matches(db)
    finally:
        db.close()
