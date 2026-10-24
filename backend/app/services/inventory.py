from __future__ import annotations

"""Deterministic listing inventory checks.

A listing is eligible only when the stored fields satisfy the search.
Missing availability stays missing. Budget is never widened.
"""

import calendar
import re
from dataclasses import dataclass
from datetime import date
from typing import Any, Iterable, Optional


def _attr(source: Any, name: str, default=None):
    if source is None:
        return default
    if isinstance(source, dict):
        return source.get(name, default)
    return getattr(source, name, default)


def parse_availability(value) -> Optional[date]:
    """Return a date only when the stored value is an ISO date.

    Words like "Flexible" or "ASAP" are not turned into a date.
    """
    if value is None:
        return None
    text = str(value).strip()
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", text)
    if not match:
        return None
    try:
        return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


def month_end(value: date) -> date:
    return date(value.year, value.month, calendar.monthrange(value.year, value.month)[1])


def months_between(start: date, end: date) -> int:
    return max(0, (end.year - start.year) * 12 + (end.month - start.month))


def within_hard_budget(listing, budget_max: Optional[int]) -> bool:
    if not budget_max or budget_max <= 0:
        return True
    rent = _attr(listing, "rent_price", None)
    if rent is None:
        return False
    try:
        return int(rent) <= int(budget_max)
    except (TypeError, ValueError):
        return False


def location_matches(listing, place: Optional[str]) -> bool:
    token = (place or "").strip().lower()
    if not token:
        return True
    location = str(_attr(listing, "location", "") or "").lower()
    return token in location


def duplicate_key(listing) -> tuple:
    location = re.sub(r"\s+", " ", str(_attr(listing, "location", "") or "").strip().lower())
    try:
        rent = int(_attr(listing, "rent_price", 0) or 0)
    except (TypeError, ValueError):
        rent = 0
    try:
        beds = int(_attr(listing, "bedrooms", 0) or 0)
    except (TypeError, ValueError):
        beds = 0
    return (location, rent, beds)


@dataclass
class DuplicateGroup:
    keeper: Any
    duplicates: list


def group_duplicates(listings: Iterable) -> list[DuplicateGroup]:
    """One keeper per location + rent + bedroom count.

    Prefer a listing whose available-from date is actually stored.
    """
    groups: dict[tuple, list] = {}
    for listing in listings:
        groups.setdefault(duplicate_key(listing), []).append(listing)

    grouped = []
    for members in groups.values():
        members.sort(
            key=lambda item: (
                parse_availability(_attr(item, "available_from")) is None,
                int(_attr(item, "id", 0) or 0),
            )
        )
        grouped.append(DuplicateGroup(keeper=members[0], duplicates=members[1:]))
    return grouped
