# app/utils/geo.py
import math

# --- Replace with your actual geocoding implementation ---
def geocode_address(address: str):
    """
    Dummy geocoder: returns (lat, lon) tuple for a given address.
    Replace this with your API integration (e.g., Google, Mapbox, Nominatim).
    """
    dummy_coords = {
        "Downtown": (42.4430, -76.5019),
        "Midtown": (42.4500, -76.4900),
        "Uptown": (42.4600, -76.4800),
        "Suburbs": (42.4700, -76.4700),
        # ... Add your neighborhoods here ...
    }
    # Default: somewhere in Ithaca
    return dummy_coords.get(address, (42.4406, -76.4966))


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate Haversine distance between two coordinates (in km).
    """
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def location_compatibility_score(renter_locs: list, landlord_loc: str, max_score=100, threshold_km=10):
    """
    Given renter's preferred locations (list of str) and landlord's property location (str),
    returns best compatibility score based on proximity.
    """
    best_score = 0
    lat2, lon2 = geocode_address(landlord_loc)
    for loc in renter_locs:
        lat1, lon1 = geocode_address(loc)
        dist = haversine_distance(lat1, lon1, lat2, lon2)
        if dist <= threshold_km:
            score = max_score - (dist / threshold_km) * max_score
            score = max(score, 0)
            if score > best_score:
                best_score = score
    return best_score
