import re
from typing import Any, Optional

from app.utils.geo import geocode_address
from app.utils.profile_helpers import normalize_contact_preference

ALLOWED_CREATE_FIELDS = {
    "title", "description", "location", "rent_price", "property_type",
    "bedrooms", "bathrooms", "available_from", "max_occupants",
    "neighborhood_type", "neighborhood_description", "neighborhood_profile",
    "amenities", "building_features", "custom_tags", "pets_allowed",
    "lease_length", "images", "sqft", "house_rules", "latitude", "longitude",
    "tenant_preferences", "tenant_custom_requirements",
}


def parse_lease_length(value) -> Optional[int]:
    if value is None or value == "":
        return 12
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else 12


def pets_label_from_allowed(allowed: Optional[bool]) -> str:
    if allowed is False:
        return "No pets"
    if allowed is True:
        return "Pet-friendly"
    return "No pets"


def normalize_listing_input(data: dict) -> dict:
    """Map frontend form fields to DB columns with sensible defaults."""
    raw = dict(data or {})
    out: dict[str, Any] = {}

    if "pets" in raw:
        out["pets_allowed"] = str(raw["pets"]).lower() not in ("no pets", "none", "no")
    elif "pets_allowed" in raw:
        out["pets_allowed"] = bool(raw["pets_allowed"])

    if "lease_length" in raw:
        out["lease_length"] = parse_lease_length(raw["lease_length"])

    if "house_rules" in raw:
        rules = raw["house_rules"]
        if isinstance(rules, str):
            text = rules.strip()
            out["house_rules"] = [text] if text else []
        elif isinstance(rules, list):
            out["house_rules"] = rules

    for key, val in raw.items():
        if key in ("pets", "lease_length", "house_rules"):
            continue
        if key in ALLOWED_CREATE_FIELDS:
            out[key] = val

    out.setdefault("property_type", "Apartment")
    out.setdefault("bedrooms", 1)
    out["bedrooms"] = int(out.get("bedrooms") or 1)
    out["bathrooms"] = max(1, int(out.get("bathrooms") or 1))
    out.setdefault("available_from", "Flexible")
    out.setdefault("max_occupants", 1)
    out.setdefault("amenities", out.get("amenities") or [])
    out.setdefault("building_features", out.get("building_features") or [])
    out.setdefault("custom_tags", out.get("custom_tags") or [])
    out.setdefault("images", out.get("images") or [])
    out.setdefault("pets_allowed", out.get("pets_allowed", True))
    out.setdefault("tenant_preferences", out.get("tenant_preferences") or [])
    out.setdefault("tenant_custom_requirements", out.get("tenant_custom_requirements") or [])

    location = (out.get("location") or raw.get("location") or "").strip()
    out["location"] = location
    if location and ("latitude" not in out or out.get("latitude") is None):
        lat, lng = geocode_address(location)
        out["latitude"] = lat
        out["longitude"] = lng

    return out


def validate_listing_images(data: dict) -> None:
    from fastapi import HTTPException

    images = data.get("images") or []
    if len(images) < 1:
        raise HTTPException(status_code=422, detail="At least one property photo is required.")


def landlord_to_dict(landlord) -> dict:
    if not landlord:
        return {
            "id": 0,
            "name": "Host",
            "email": "",
            "phone": "",
            "contact_preference": "any",
            "created_at": None,
        }
    return {
        "id": landlord.id,
        "name": landlord.name or "Host",
        "avatar": landlord.profilePicture or "",
        "profilePicture": landlord.profilePicture or "",
        "email": landlord.email or "",
        "phone": landlord.phone or "",
        "contact_preference": getattr(landlord, "contact_preference", None) or "email",
        "created_at": landlord.created_at,
    }


def serialize_listing(
    listing,
    match_score: Optional[float] = None,
    match_breakdown: Optional[dict] = None,
) -> dict:
    """Build a frontend-friendly listing dict."""
    landlord = getattr(listing, "landlord", None)
    landlord_data = landlord_to_dict(landlord)

    lat = getattr(listing, "latitude", None)
    lng = getattr(listing, "longitude", None)
    if (lat is None or lng is None) and listing.location:
        lat, lng = geocode_address(listing.location)

    house_rules = listing.house_rules or []
    if isinstance(house_rules, list):
        house_rules_display = ", ".join(house_rules) if house_rules else ""
    else:
        house_rules_display = str(house_rules)

    lease = listing.lease_length
    lease_display = f"{lease} months" if lease else None

    return {
        "id": listing.id,
        "landlord_id": listing.landlord_id,
        "landlord": landlord_data,
        "title": listing.title,
        "description": listing.description,
        "location": listing.location,
        "rent_price": listing.rent_price,
        "created_at": listing.created_at,
        "property_type": listing.property_type,
        "bedrooms": listing.bedrooms,
        "bathrooms": listing.bathrooms,
        "sqft": listing.sqft,
        "house_rules": house_rules_display or house_rules,
        "tenant_preferences": listing.tenant_preferences or [],
        "tenant_custom_requirements": listing.tenant_custom_requirements or [],
        "available_from": listing.available_from,
        "max_occupants": listing.max_occupants,
        "neighborhood_type": listing.neighborhood_type,
        "neighborhood_description": listing.neighborhood_description,
        "neighborhood_profile": listing.neighborhood_profile or [],
        "amenities": listing.amenities or [],
        "building_features": listing.building_features or [],
        "custom_tags": listing.custom_tags or [],
        "pets_allowed": listing.pets_allowed,
        "pets": pets_label_from_allowed(listing.pets_allowed),
        "lease_length": lease_display or lease,
        "images": listing.images or [],
        "latitude": lat,
        "longitude": lng,
        "lat": lat,
        "lng": lng,
        "match_score": match_breakdown.get("overall", match_score) if match_breakdown else match_score,
        "match_breakdown": match_breakdown,
    }
