"""Constrained housing search.

Hard filters stay hard: a max rent is never widened, and a listing with no
parseable available-from date is not described as available. Ranking among
the listings that pass is a hybrid heuristic, not a trained model.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from time import perf_counter
from typing import Optional

from app.services.inventory import (
    duplicate_key,
    group_duplicates,
    location_matches,
    month_end,
    months_between,
    parse_availability,
    within_hard_budget,
)

_MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}
_MONTH_PATTERN = "|".join(_MONTHS)
_RENT_RE = re.compile(
    r"(?:below|under|less than|at most|up to|max(?:imum)?)\s+\$?\s*(\d[\d,]*)",
    re.IGNORECASE,
)
_PLACE_RE = re.compile(
    r"\b(?:near|in|around)\s+([A-Za-z][A-Za-z.'’ -]{1,40}?)(?=\s+for\b|\s+from\b|\s+between\b|,|$)",
    re.IGNORECASE,
)
_RANGE_RE = re.compile(
    rf"({_MONTH_PATTERN})\s+(\d{{4}})\s*[-–—]\s*({_MONTH_PATTERN})\s+(\d{{4}})",
    re.IGNORECASE,
)
_UTILITY_WORDS = ("utilit", "electric", "water", "heat", "gas", "internet", "wifi", "wi-fi")


@dataclass
class ScoutQuery:
    text: str = ""
    max_rent: Optional[int] = None
    location: Optional[str] = None
    start: Optional[date] = None
    end: Optional[date] = None
    semester_alternatives: bool = False
    hard_constraints: list[str] = field(default_factory=list)

    def describe_constraints(self) -> list[str]:
        constraints = []
        if self.max_rent is not None:
            constraints.append(f"rent at or below ${self.max_rent}")
        if self.location:
            constraints.append(f"location contains {self.location}")
        if self.start and self.end:
            constraints.append(
                f"available from {self.start.isoformat()} through before {self.end.isoformat()}"
            )
        elif self.start:
            constraints.append(f"available by {month_end(self.start).isoformat()}")
        if self.semester_alternatives and self.start and self.end:
            constraints.append("semester start dates inside that window are allowed and labeled")
        return constraints


def _month_date(name: str, year: str) -> date:
    return date(int(year), _MONTHS[name.lower()], 1)


def parse_scout_text(text: str) -> ScoutQuery:
    raw = (text or "").strip()
    query = ScoutQuery(text=raw)
    rent = _RENT_RE.search(raw)
    if rent:
        query.max_rent = int(rent.group(1).replace(",", ""))
    place = _PLACE_RE.search(raw)
    if place:
        query.location = re.sub(r"\s+", " ", place.group(1)).strip(" .")
    window = _RANGE_RE.search(raw)
    if window:
        query.start = _month_date(window.group(1), window.group(2))
        query.end = _month_date(window.group(3), window.group(4))
    if re.search(r"semester alternatives", raw, re.IGNORECASE):
        query.semester_alternatives = True
    query.hard_constraints = query.describe_constraints()
    return query


def _listing_blob(listing) -> str:
    parts = [
        getattr(listing, "description", "") or "",
        " ".join(getattr(listing, "amenities", None) or []),
        " ".join(getattr(listing, "building_features", None) or []),
        " ".join(getattr(listing, "custom_tags", None) or []),
    ]
    return " ".join(parts).lower()


def _questions(listing, available: Optional[date]) -> list[str]:
    questions = []
    blob = _listing_blob(listing)
    if not any(word in blob for word in _UTILITY_WORDS):
        questions.append("Are utilities included, and which ones?")
    if getattr(listing, "lease_length", None) in (None, "", 0):
        questions.append("What lease length is actually offered?")
    if available is not None:
        questions.append(f"Is the unit still available from {available.isoformat()}?")
    return questions


def _classify(listing, query: ScoutQuery) -> tuple[str, list[str]]:
    """Return (status, compromises).

    status is one of: primary, semester_alternative, over_budget,
    outside_location, availability_unknown, outside_dates.
    """
    if query.location and not location_matches(listing, query.location):
        return "outside_location", []
    if query.max_rent is not None and not within_hard_budget(listing, query.max_rent):
        return "over_budget", []

    available = parse_availability(getattr(listing, "available_from", None))
    compromises: list[str] = []
    if query.start is None:
        if available is None:
            return "availability_unknown", []
        return "primary", compromises

    if available is None:
        return "availability_unknown", []

    deadline = month_end(query.start)
    period_end = query.end
    if period_end is not None and available >= period_end:
        return "outside_dates", []
    if available <= deadline:
        kind = "primary"
    elif query.semester_alternatives and period_end is not None and available < period_end:
        kind = "semester_alternative"
        compromises.append(
            f"Available {available.isoformat()}, a semester alternative to a {query.start:%B %Y} move-in."
        )
    else:
        return "outside_dates", []

    if query.start and query.end:
        needed = months_between(query.start, query.end)
        lease = getattr(listing, "lease_length", None)
        try:
            lease_months = int(lease) if lease not in (None, "") else None
        except (TypeError, ValueError):
            lease_months = None
        if lease_months is not None and needed and lease_months < needed:
            compromises.append(
                f"Listed lease is {lease_months} months, shorter than {query.start:%B %Y}–{query.end:%B %Y}."
            )
    return kind, compromises


def _rank_score(kind: str, compromises: list[str]) -> float:
    score = 1.0 if kind == "primary" else 0.85
    if any(item.startswith("Listed lease") for item in compromises):
        score -= 0.1
    return round(max(0.0, score), 3)


def run_scout(listings: list, query: ScoutQuery) -> dict:
    started = perf_counter()
    excluded = {
        "over_budget": 0,
        "outside_location": 0,
        "availability_unknown": [],
        "outside_dates": 0,
        "duplicates": [],
    }
    results = []
    considered = 0

    for group in group_duplicates(listings):
        listing = group.keeper
        for duplicate in group.duplicates:
            excluded["duplicates"].append(
                {
                    "id": getattr(duplicate, "id", None),
                    "kept_id": getattr(listing, "id", None),
                    "key": list(duplicate_key(listing)),
                }
            )
        considered += 1
        kind, compromises = _classify(listing, query)
        if kind == "over_budget":
            excluded["over_budget"] += 1
            continue
        if kind == "outside_location":
            excluded["outside_location"] += 1
            continue
        if kind == "availability_unknown":
            excluded["availability_unknown"].append(
                {
                    "id": getattr(listing, "id", None),
                    "title": getattr(listing, "title", ""),
                    "reason": "available_from is not a YYYY-MM-DD date, so availability was not assumed",
                }
            )
            continue
        if kind == "outside_dates":
            excluded["outside_dates"] += 1
            continue

        available = parse_availability(getattr(listing, "available_from", None))
        results.append(
            {
                "id": getattr(listing, "id", None),
                "title": getattr(listing, "title", ""),
                "location": getattr(listing, "location", ""),
                "rent_price": getattr(listing, "rent_price", None),
                "bedrooms": getattr(listing, "bedrooms", None),
                "lease_length": getattr(listing, "lease_length", None),
                "match_type": kind,
                "rank_score": _rank_score(kind, compromises),
                "availability": {
                    "known": True,
                    "available_from": available.isoformat() if available else None,
                    "source": "listing.available_from",
                },
                "compromises": compromises,
                "questions": _questions(listing, available),
                "hard_filters_passed": query.describe_constraints(),
            }
        )

    results.sort(key=lambda item: (-item["rank_score"], item["rent_price"] or 0, item["id"] or 0))
    elapsed_ms = round((perf_counter() - started) * 1000, 3)
    return {
        "matcher": "hybrid_heuristic",
        "learned_ranking": False,
        "query": {
            "text": query.text,
            "max_rent": query.max_rent,
            "location": query.location,
            "start": query.start.isoformat() if query.start else None,
            "end": query.end.isoformat() if query.end else None,
            "semester_alternatives": query.semester_alternatives,
            "hard_constraints": query.describe_constraints(),
        },
        "note": (
            "Budget, place, and dates are deterministic filters. "
            "Listings without a stored available-from date are excluded instead of marked available."
        ),
        "results": results,
        "excluded": excluded,
        "benchmark": {
            "listings": len(list(listings)),
            "keepers_considered": considered,
            "ranked": len(results),
            "elapsed_ms": elapsed_ms,
        },
    }
