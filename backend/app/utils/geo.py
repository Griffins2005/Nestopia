"""Geocoding (Nominatim), coordinates, and distance-based matching."""
import hashlib
import logging
import math
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

# --- Nominatim (free OSM geocoding, backend-only) ---

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "Nestopia/1.0 (local dev; rental matching demo)"
_MIN_INTERVAL = 1.05
_last_request_at = 0.0
_search_cache: Dict[str, List[dict]] = {}
_geocode_cache: Dict[str, Optional[dict]] = {}
_CACHE_MAX = 300

_DEFAULT_LAT, _DEFAULT_LNG = 40.6782, -73.9442
_KNOWN = {
    "park slope": (40.6710, -73.9814),
    "bed-stuy": (40.6872, -73.9418),
    "williamsburg": (40.7081, -73.9571),
    "fort greene": (40.6892, -73.9747),
    "seattle, wa": (47.6062, -122.3321),
    "atlanta, ga": (33.7490, -84.3880),
    "ithaca, ny": (42.4430, -76.5019),
    "ithaca": (42.4430, -76.5019),
    "brooklyn": (40.6782, -73.9442),
    "manhattan": (40.7831, -73.9712),
}


def _throttle() -> None:
    global _last_request_at
    elapsed = time.monotonic() - _last_request_at
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_request_at = time.monotonic()


def _trim_cache(cache: dict) -> None:
    if len(cache) > _CACHE_MAX:
        for key in list(cache.keys())[: len(cache) - _CACHE_MAX]:
            cache.pop(key, None)


def _parse_nominatim_result(item: dict) -> dict:
    return {
        "label": item.get("display_name") or "",
        "lat": float(item["lat"]),
        "lng": float(item["lon"]),
        "type": item.get("type") or item.get("class") or "place",
        "osm_id": item.get("osm_id"),
    }


def search_places(query: str, limit: int = 6, prefer_addresses: bool = False) -> List[dict]:
    q = (query or "").strip()
    if len(q) < 2:
        return []

    cache_key = f"{q.lower()}:{limit}:{'addr' if prefer_addresses else 'any'}"
    if cache_key in _search_cache:
        return _search_cache[cache_key]

    _throttle()
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                f"{NOMINATIM_BASE}/search",
                params={"q": q, "format": "json", "limit": min(limit * 2, 10), "addressdetails": 1},
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("Nominatim search failed for %r: %s", q, exc)
        return []

    results = [_parse_nominatim_result(item) for item in data if item.get("lat") and item.get("lon")]
    if prefer_addresses:
        def _rank(item: dict) -> tuple:
            t = (item.get("type") or "").lower()
            if t in {"house", "building", "residential", "apartments", "terrace"}:
                return (0, item.get("label", ""))
            if t in {"road", "street", "pedestrian", "footway"}:
                return (1, item.get("label", ""))
            return (2, item.get("label", ""))

        results.sort(key=_rank)
    results = results[:limit]
    _search_cache[cache_key] = results
    _trim_cache(_search_cache)
    return results


def geocode_sync(query: str) -> Optional[dict]:
    q = (query or "").strip()
    if not q:
        return None
    key = q.lower()
    if key in _geocode_cache:
        return _geocode_cache[key]
    results = search_places(q, limit=1)
    result = results[0] if results else None
    _geocode_cache[key] = result
    _trim_cache(_geocode_cache)
    return result


# --- Location normalization ---


def format_location_label(entry: Any) -> str:
    if entry is None:
        return ""
    if isinstance(entry, str):
        return entry.strip()
    if isinstance(entry, dict):
        return (entry.get("label") or entry.get("name") or "").strip()
    return str(entry)


def location_coords(entry: Any) -> Optional[Tuple[float, float]]:
    if isinstance(entry, dict):
        lat, lng = entry.get("lat"), entry.get("lng")
        if lat is not None and lng is not None:
            try:
                return float(lat), float(lng)
            except (TypeError, ValueError):
                pass
    label = format_location_label(entry)
    if label:
        geo = geocode_sync(label)
        if geo:
            return geo["lat"], geo["lng"]
    return None


def normalize_location_entry(entry: Any) -> dict:
    if isinstance(entry, dict):
        label = format_location_label(entry)
        lat, lng = entry.get("lat"), entry.get("lng")
        if label and lat is not None and lng is not None:
            return {"label": label, "lat": float(lat), "lng": float(lng)}
        if label:
            geo = geocode_sync(label)
            if geo:
                return geo
            return {"label": label, "lat": None, "lng": None}
    if isinstance(entry, str) and entry.strip():
        label = entry.strip()
        geo = geocode_sync(label)
        if geo:
            return geo
        return {"label": label, "lat": None, "lng": None}
    return {"label": "", "lat": None, "lng": None}


def normalize_locations_list(entries: List[Any]) -> List[dict]:
    out: List[dict] = []
    seen = set()
    for entry in entries or []:
        normalized = normalize_location_entry(entry)
        label = normalized.get("label") or ""
        if not label:
            continue
        key = (label.lower(), normalized.get("lat"), normalized.get("lng"))
        if key in seen:
            continue
        seen.add(key)
        out.append(normalized)
    return out


def renter_location_points(locations: List[Any]) -> List[Tuple[float, float]]:
    points: List[Tuple[float, float]] = []
    for entry in locations or []:
        coords = location_coords(entry)
        if coords:
            points.append(coords)
    return points


# --- Coordinates & distance ---


def geocode_address(address: str) -> Tuple[float, float]:
    if not address:
        return _DEFAULT_LAT, _DEFAULT_LNG
    geo = geocode_sync(address)
    if geo:
        return geo["lat"], geo["lng"]
    key = address.strip().lower()
    for name, coords in _KNOWN.items():
        if name in key:
            return coords
    digest = hashlib.md5(key.encode()).hexdigest()
    h1, h2 = int(digest[:8], 16), int(digest[8:16], 16)
    lat = _DEFAULT_LAT + ((h1 % 1000) / 1000 - 0.5) * 0.12
    lng = _DEFAULT_LNG + ((h2 % 1000) / 1000 - 0.5) * 0.18
    return lat, lng


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def location_compatibility_score(renter_locs: list, landlord_loc: str, max_score=100, threshold_km=10):
    points = renter_location_points(renter_locs)
    if not points:
        for loc in renter_locs or []:
            lat, lon = geocode_address(format_location_label(loc))
            points.append((lat, lon))
    lat2, lon2 = geocode_address(landlord_loc)
    best_score = 0
    for lat1, lon1 in points:
        dist = haversine_distance(lat1, lon1, lat2, lon2)
        if dist <= threshold_km:
            score = max(max_score - (dist / threshold_km) * max_score, 0)
            if score > best_score:
                best_score = score
    return best_score


def _listing_coords(listing) -> Optional[Tuple[float, float]]:
    lat = getattr(listing, "latitude", None) or getattr(listing, "lat", None)
    lng = getattr(listing, "longitude", None) or getattr(listing, "lng", None)
    if lat is not None and lng is not None:
        try:
            return float(lat), float(lng)
        except (TypeError, ValueError):
            pass
    location = getattr(listing, "location", None) or ""
    if location:
        return geocode_address(location)
    return None


def distance_location_score(renter_locations: list, listing) -> Optional[float]:
    """Return 0–1 location fit between renter preferred areas and a listing."""
    points = renter_location_points(renter_locations)
    if not points:
        return None

    coords = _listing_coords(listing)
    if not coords:
        return None

    lat2, lon2 = coords
    best = 0.0
    for lat1, lon1 in points:
        dist = haversine_distance(lat1, lon1, lat2, lon2)
        score = max(0.0, 1.0 - min(1.0, dist / 50.0))
        best = max(best, score)
    return best
