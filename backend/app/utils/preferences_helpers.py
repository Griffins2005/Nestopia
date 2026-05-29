from app.utils.geo import normalize_locations_list
import re


def _parse_lease_length(value) -> int:
    if value is None or value == "":
        return 12
    if isinstance(value, int):
        return value
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else 12


def normalize_renter_prefs(data: dict) -> dict:
    raw = dict(data or {})
    out = dict(raw)

    if "household" in raw and "household_size" not in raw:
        out["household_size"] = raw["household"]
    if "move_in" in raw and "move_in_date" not in raw:
        out["move_in_date"] = raw["move_in"]
    if "pets" in raw and "pets_allowed" not in raw:
        out["pets_allowed"] = str(raw["pets"]).lower() not in ("no pets", "none", "no")
    if "lease_length" in raw:
        out["lease_length"] = _parse_lease_length(raw["lease_length"])

    return {
        "budget_min": int(out.get("budget_min") or 0),
        "budget_max": int(out.get("budget_max") or 0),
        "bedrooms": int(out.get("bedrooms") or 1),
        "bathrooms": int(out.get("bathrooms") or 1),
        "household_size": int(out.get("household_size") or out.get("household") or 1),
        "locations": normalize_locations_list(out.get("locations") or []),
        "move_in_date": out.get("move_in_date") or out.get("move_in") or "Flexible",
        "lease_length": _parse_lease_length(out.get("lease_length")),
        "amenities": _normalize_tags(out.get("amenities")),
        "building_amenities": _normalize_tags(out.get("building_amenities")),
        "pets_allowed": bool(out.get("pets_allowed", True)),
        "smoking_preference": out.get("smoking_preference"),
        "noise_tolerance": out.get("noise_tolerance"),
        "visitor_flexibility": out.get("visitor_flexibility"),
        "custom_preferences": _normalize_tags(out.get("custom_preferences")),
    }


def _normalize_tags(tags) -> list:
    seen = []
    for item in tags or []:
        cleaned = re.sub(r"\s+", " ", str(item).strip())
        if cleaned and cleaned not in seen:
            seen.append(cleaned)
    return seen


def normalize_landlord_prefs(data: dict) -> dict:
    raw = dict(data or {})
    return {
        "tenant_preferences": _normalize_tags(raw.get("tenant_preferences")),
        "lease_length": _parse_lease_length(raw.get("lease_length")),
        "pets_allowed": bool(raw.get("pets_allowed", True)),
        "custom_requirements": _normalize_tags(raw.get("custom_requirements")),
    }


def renter_prefs_for_frontend(prefs) -> dict:
    if not prefs:
        return {}
    return {
        "budget_min": prefs.budget_min,
        "budget_max": prefs.budget_max,
        "bedrooms": prefs.bedrooms,
        "bathrooms": prefs.bathrooms,
        "household_size": prefs.household_size,
        "household": prefs.household_size,
        "locations": prefs.locations or [],
        "move_in_date": prefs.move_in_date,
        "move_in": prefs.move_in_date,
        "lease_length": prefs.lease_length,
        "amenities": prefs.amenities or [],
        "building_amenities": prefs.building_amenities or [],
        "pets_allowed": prefs.pets_allowed,
        "pets": "No pets" if prefs.pets_allowed is False else "Dog",
        "smoking_preference": prefs.smoking_preference,
        "noise_tolerance": prefs.noise_tolerance,
        "visitor_flexibility": prefs.visitor_flexibility,
        "custom_preferences": prefs.custom_preferences or [],
    }
