# app/utils/match.py
"""Compatibility scoring: renter preferences vs property + listing tenant requirements."""

import re
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from app.utils.geo import distance_location_score, format_location_label


def _attr(source, name, default=None):
    if source is None:
        return default
    if isinstance(source, dict):
        return source.get(name, default)
    return getattr(source, name, default)


def parse_lease_months(value) -> Optional[int]:
    if value is None or value == "":
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None


def _parse_iso_date(value: str) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    trimmed = value.strip()[:10]
    if re.match(r"^\d{4}-\d{2}-\d{2}$", trimmed):
        try:
            return datetime.strptime(trimmed, "%Y-%m-%d")
        except ValueError:
            return None
    return None


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _fuzzy_set(items) -> set:
    return {_normalize_text(i) for i in (items or []) if str(i).strip()}


def _renter_matches_requirement(req: str, renter) -> float:
    """Return 0–1 fit for one listing tenant requirement vs renter profile."""
    r = _normalize_text(req)
    if not r:
        return 1.0

    pets = bool(_attr(renter, "pets_allowed"))
    smoking = _normalize_text(_attr(renter, "smoking_preference"))
    noise = _normalize_text(_attr(renter, "noise_tolerance"))
    renter_custom = _fuzzy_set(_attr(renter, "custom_preferences"))

    if r in renter_custom:
        return 1.0
    if any(r in c or c in r for c in renter_custom):
        return 0.95

    if "no pet" in r:
        return 1.0 if not pets else 0.0
    if "pet" in r and ("friendly" in r or "allow" in r):
        return 1.0 if pets else 0.55

    if "no smoking" in r or "non-smoking" in r or "non smoking" in r:
        if smoking in {"no smoking", "prefer non-smoking", "non smoking"}:
            return 1.0
        if "smok" in smoking and "no" not in smoking and "non" not in smoking:
            return 0.0
        return 0.7

    if "quiet" in r:
        if noise in {"very quiet", "moderate"}:
            return 1.0
        return 0.65

    if "long-term lease" in r or "long term lease" in r:
        lease = parse_lease_months(_attr(renter, "lease_length"))
        return 1.0 if lease and lease >= 12 else 0.65

    if any(k in r for k in ("credit check", "background check", "reference", "verification", "insurance")):
        return 0.82

    if "student" in r:
        return 0.75
    if "professional" in r or "employed" in r:
        return 0.75
    if "no subletting" in r or "sublett" in r:
        return 0.88

    return 0.72


def score_tenant_fit(renter, listing) -> float:
    """How well the renter profile aligns with this listing's tenant requirements."""
    reqs = list(_attr(listing, "tenant_preferences") or [])
    reqs.extend(_attr(listing, "tenant_custom_requirements") or [])

    house_rules = _attr(listing, "house_rules")
    if isinstance(house_rules, list):
        reqs.extend(house_rules)
    elif house_rules:
        reqs.extend([p for p in re.split(r"[,;]\s*", str(house_rules)) if p.strip()])

    reqs = [req for req in reqs if str(req).strip()]
    if not reqs:
        return 1.0

    scores = [_renter_matches_requirement(req, renter) for req in reqs]
    return sum(scores) / len(scores)


def score_property_fit(renter, listing) -> Tuple[float, Dict[str, float]]:
    """How well the listing property matches renter housing preferences. Returns (0–1, breakdown)."""
    weights = {
        "budget": 18,
        "location": 14,
        "bedrooms": 10,
        "bathrooms": 8,
        "unit_amenities": 12,
        "building_amenities": 6,
        "lease_length": 6,
        "move_in": 6,
        "pets": 8,
        "occupants": 4,
        "custom_tags": 4,
    }
    total = sum(weights.values())
    parts: Dict[str, float] = {}

    budget_min = _attr(renter, "budget_min", 0) or 0
    budget_max = _attr(renter, "budget_max", 0) or 0
    rent_price = _attr(listing, "rent_price", 0) or 0
    if budget_max > 0 and budget_min >= 0 and budget_min <= rent_price <= budget_max:
        parts["budget"] = 1.0
    elif budget_max > 0 and budget_min > 0:
        span = max(1, budget_max - budget_min)
        delta = max(0, rent_price - budget_max, budget_min - rent_price)
        parts["budget"] = max(0.0, 1.0 - min(1.0, delta / span))
    else:
        parts["budget"] = 0.5

    renter_locations = _attr(renter, "locations", []) or []
    dist_score = distance_location_score(renter_locations, listing)
    if dist_score is not None:
        parts["location"] = dist_score
    else:
        listing_location = (_attr(listing, "location", "") or "").lower()
        neighborhood_profile = {_normalize_text(p) for p in (_attr(listing, "neighborhood_profile") or [])}
        renter_labels = {_normalize_text(format_location_label(loc)) for loc in renter_locations}
        hit = any(
            loc and (loc in listing_location or any(loc in n or n in loc for n in neighborhood_profile))
            for loc in renter_labels
        )
        parts["location"] = 1.0 if hit else 0.25

    listing_beds = _attr(listing, "bedrooms", 0) or 0
    desired_beds = _attr(renter, "bedrooms", 0) or 0
    if listing_beds >= desired_beds:
        parts["bedrooms"] = 1.0
    elif desired_beds:
        parts["bedrooms"] = max(0.0, 1.0 - (desired_beds - listing_beds) / desired_beds)
    else:
        parts["bedrooms"] = 1.0

    listing_baths = _attr(listing, "bathrooms", 0) or 0
    desired_baths = _attr(renter, "bathrooms", 0) or 0
    if listing_baths >= desired_baths:
        parts["bathrooms"] = 1.0
    elif desired_baths:
        parts["bathrooms"] = max(0.0, 1.0 - (desired_baths - listing_baths) / desired_baths)
    else:
        parts["bathrooms"] = 1.0

    renter_amenities = _fuzzy_set(_attr(renter, "amenities"))
    listing_amenities = _fuzzy_set(_attr(listing, "amenities"))
    if renter_amenities:
        overlap = len(renter_amenities & listing_amenities) / len(renter_amenities)
        parts["unit_amenities"] = overlap
    else:
        parts["unit_amenities"] = 0.5

    renter_building = _fuzzy_set(_attr(renter, "building_amenities"))
    listing_building = _fuzzy_set(_attr(listing, "building_features"))
    if renter_building:
        parts["building_amenities"] = len(renter_building & listing_building) / len(renter_building)
    else:
        parts["building_amenities"] = 0.5

    desired_lease = parse_lease_months(_attr(renter, "lease_length"))
    listing_lease = parse_lease_months(_attr(listing, "lease_length"))
    if desired_lease and listing_lease:
        diff = abs(desired_lease - listing_lease)
        parts["lease_length"] = max(0.0, 1.0 - diff / max(desired_lease, 1))
    else:
        parts["lease_length"] = 0.6

    move_in_raw = _attr(renter, "move_in_date") or _attr(renter, "move_in") or ""
    available = _attr(listing, "available_from") or ""
    move_in_lower = str(move_in_raw).lower()
    if move_in_lower in {"flexible", "asap", "immediately", "next month", "2-3 months"}:
        parts["move_in"] = 0.85
    else:
        renter_from = _parse_iso_date(str(move_in_raw).split("/")[0] if "/" in str(move_in_raw) else str(move_in_raw))
        avail = _parse_iso_date(str(available))
        if renter_from and avail:
            if avail <= renter_from:
                parts["move_in"] = 1.0
            else:
                days_late = (avail - renter_from).days
                parts["move_in"] = max(0.2, 1.0 - min(1.0, days_late / 90))
        elif available:
            parts["move_in"] = 0.5 if move_in_lower in str(available).lower() else 0.45
        else:
            parts["move_in"] = 0.6

    renter_has_pets = bool(_attr(renter, "pets_allowed"))
    listing_allows_pets = _attr(listing, "pets_allowed", True)
    if renter_has_pets and listing_allows_pets:
        parts["pets"] = 1.0
    elif renter_has_pets and not listing_allows_pets:
        parts["pets"] = 0.0
    else:
        parts["pets"] = 0.85

    household = _attr(renter, "household_size", 1) or 1
    max_occ = _attr(listing, "max_occupants", 0) or 0
    if not max_occ:
        parts["occupants"] = 0.5
    elif household <= max_occ:
        parts["occupants"] = 1.0
    else:
        parts["occupants"] = max(0.0, 1.0 - (household - max_occ) / household)

    renter_custom = _fuzzy_set(_attr(renter, "custom_preferences"))
    listing_tags = _fuzzy_set(_attr(listing, "custom_tags"))
    if renter_custom:
        parts["custom_tags"] = len(renter_custom & listing_tags) / len(renter_custom)
    else:
        parts["custom_tags"] = 0.4

    weighted = sum(parts[k] * weights[k] for k in weights)
    return weighted / total, parts


def compute_compatibility_breakdown(renter, landlord_prefs, listing) -> Dict[str, Any]:
    """
    Full breakdown for API/debug.
    landlord_prefs is ignored (tenant requirements are listing-specific).
    """
    del landlord_prefs
    property_score, property_parts = score_property_fit(renter, listing)
    tenant_score = score_tenant_fit(renter, listing)

    property_weight = 0.72
    tenant_weight = 0.28
    overall = property_weight * property_score + tenant_weight * tenant_score

    return {
        "overall": round(max(0.0, min(1.0, overall)), 3),
        "overall_percent": round(max(0.0, min(1.0, overall)) * 100),
        "property_fit": round(property_score, 3),
        "property_fit_percent": round(property_score * 100),
        "tenant_fit": round(tenant_score, 3),
        "tenant_fit_percent": round(tenant_score * 100),
        "property_breakdown": {k: round(v, 3) for k, v in property_parts.items()},
    }


def compute_compatibility_score(renter, landlord_prefs, listing) -> float:
    """
    Compatibility 0–1: property fit (72%) + tenant requirement fit (28%).
    landlord_prefs kept for API compatibility but not used.
    """
    del landlord_prefs  # listing-level tenant requirements only
    breakdown = compute_compatibility_breakdown(renter, None, listing)
    return breakdown["overall"]
