# app/utils/match.py

def compute_compatibility_score(renter, landlord_prefs, listing):
    """
    renter: RenterPreferences SQLAlchemy instance or dict
    landlord_prefs: LandlordPreferences SQLAlchemy instance or dict
    listing: Listing SQLAlchemy instance or dict
    """

    def attr(source, name, default=None):
        if source is None:
            return default
        if isinstance(source, dict):
            return source.get(name, default)
        return getattr(source, name, default)

    weights = {
        "budget": 20,
        "location": 15,
        "bedrooms": 10,
        "bathrooms": 8,
        "unit_amenities": 10,
        "building_amenities": 5,
        "lease_length": 8,
        "move_in": 7,
        "pets": 7,
        "tenant_policies": 5,
        "occupants": 3,
        "custom_tags": 4,
        "landlord_requirements": 8,
    }

    score = 0.0
    total = sum(weights.values())

    budget_min = attr(renter, "budget_min", 0)
    budget_max = attr(renter, "budget_max", 0)
    rent_price = attr(listing, "rent_price", 0) or 0
    if budget_min <= rent_price <= budget_max and budget_max > 0:
        score += weights["budget"]
    elif budget_max > 0 and budget_min > 0:
        range_span = max(1, budget_max - budget_min)
        over = max(0, rent_price - budget_max)
        under = max(0, budget_min - rent_price)
        delta = over or under
        penalty = min(1.0, delta / range_span)
        score += weights["budget"] * (1 - penalty)
    else:
        score += weights["budget"] * 0.5

    renter_locations = set(attr(renter, "locations", []) or [])
    listing_location = (attr(listing, "location", "") or "").lower()
    neighborhood_type = (attr(listing, "neighborhood_type", "") or "").lower()
    neighborhood_profile = {p.lower() for p in (attr(listing, "neighborhood_profile", []) or [])}
    location_hit = False
    for loc in renter_locations:
        loc_l = (loc or "").lower()
        if loc_l and (loc_l in listing_location or loc_l in neighborhood_profile):
            location_hit = True
            break
    if not location_hit and neighborhood_type:
        location_hit = neighborhood_type in {loc.lower() for loc in renter_locations}
    score += weights["location"] if location_hit else weights["location"] * 0.2

    listing_bedrooms = attr(listing, "bedrooms", 0) or 0
    desired_bedrooms = attr(renter, "bedrooms", 0) or 0
    if listing_bedrooms >= desired_bedrooms:
        score += weights["bedrooms"]
    else:
        deficit = desired_bedrooms - listing_bedrooms
        penalty = min(1.0, deficit / max(1, desired_bedrooms))
        score += weights["bedrooms"] * (1 - penalty)

    listing_baths = attr(listing, "bathrooms", 0) or 0
    desired_baths = attr(renter, "bathrooms", 0) or 0
    if listing_baths >= desired_baths:
        score += weights["bathrooms"]
    else:
        deficit = desired_baths - listing_baths
        penalty = min(1.0, deficit / max(1, desired_baths))
        score += weights["bathrooms"] * (1 - penalty)

    renter_unit_amenities = set(attr(renter, "amenities", []) or [])
    listing_unit_amenities = set(attr(listing, "amenities", []) or [])
    if renter_unit_amenities:
        unit_overlap = len(renter_unit_amenities & listing_unit_amenities) / len(renter_unit_amenities)
        score += weights["unit_amenities"] * unit_overlap
    else:
        score += weights["unit_amenities"] * 0.5

    renter_building_amenities = set(attr(renter, "building_amenities", []) or [])
    listing_building_features = set(attr(listing, "building_features", []) or [])
    if renter_building_amenities:
        building_overlap = len(renter_building_amenities & listing_building_features) / len(renter_building_amenities)
        score += weights["building_amenities"] * building_overlap
    else:
        score += weights["building_amenities"] * 0.5

    desired_lease = attr(renter, "lease_length")
    listing_lease = attr(listing, "lease_length")
    if desired_lease and listing_lease:
        diff = abs(desired_lease - listing_lease)
        penalty = min(1.0, diff / max(1, desired_lease))
        score += weights["lease_length"] * (1 - penalty)
    else:
        score += weights["lease_length"] * 0.6

    move_in_pref = (attr(renter, "move_in_date", "") or "").lower()
    available_from = attr(listing, "available_from")
    if move_in_pref and available_from:
        if move_in_pref in {"asap", "immediately"}:
            match = True
        else:
            match = move_in_pref in available_from.lower()
        score += weights["move_in"] if match else weights["move_in"] * 0.4
    else:
        score += weights["move_in"] * 0.6

    renter_has_pets = bool(attr(renter, "pets_allowed"))
    listing_pets_allowed = attr(listing, "pets_allowed", True)
    if renter_has_pets and listing_pets_allowed:
        score += weights["pets"]
    elif renter_has_pets and not listing_pets_allowed:
        score += weights["pets"] * 0.1
    elif not renter_has_pets:
        score += weights["pets"] * 0.8

    tenant_prefs = set()
    if landlord_prefs:
        tenant_prefs = set(attr(landlord_prefs, "tenant_preferences", []) or [])

    smoking_pref = (attr(renter, "smoking_preference") or "").lower()
    if smoking_pref:
        if smoking_pref in {"no smoking", "non smoking", "non-smoking"}:
            score += weights["tenant_policies"] if "No smoking" in tenant_prefs else weights["tenant_policies"] * 0.4
        elif smoking_pref in {"smoker friendly", "smoking ok"}:
            score += weights["tenant_policies"] * 0.8
        else:
            score += weights["tenant_policies"] * 0.6
    else:
        score += weights["tenant_policies"] * 0.5

    household_size = attr(renter, "household_size", 1) or 1
    max_occupants = attr(listing, "max_occupants", 0) or 0
    if not max_occupants:
        score += weights["occupants"] * 0.5
    elif household_size <= max_occupants:
        score += weights["occupants"]
    else:
        overflow = household_size - max_occupants
        penalty = min(1.0, overflow / household_size)
        score += weights["occupants"] * (1 - penalty)

    renter_custom = set(attr(renter, "custom_preferences", []) or [])
    listing_tags = set(attr(listing, "custom_tags", []) or [])
    if renter_custom:
        custom_overlap = len(renter_custom & listing_tags) / len(renter_custom)
        score += weights["custom_tags"] * custom_overlap
    else:
        score += weights["custom_tags"] * 0.4

    landlord_req_score = weights["landlord_requirements"]
    if landlord_prefs:
        penalties = 0.0
        if "No pets" in tenant_prefs and renter_has_pets:
            penalties += 0.6
        if "No smoking" in tenant_prefs and smoking_pref in {"smoker friendly", "smoking ok"}:
            penalties += 0.4
        score += landlord_req_score * max(0, 1 - penalties)
    else:
        score += landlord_req_score * 0.5

    normalized = max(0.0, min(1.0, score / total))
    return round(normalized, 3)
