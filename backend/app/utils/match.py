# app/utils/match.py

def compute_compatibility_score(renter, landlord_prefs, listing):
    """
    renter: RenterPreferences SQLAlchemy instance or dict
    landlord_prefs: LandlordPreferences SQLAlchemy instance or dict
    listing: Listing SQLAlchemy instance or dict
    """
    score = 0
    total = 0

    # 1. Budget: 25
    total += 25
    if renter.budget_min <= listing.rent_price <= renter.budget_max:
        score += 25
    else:
        # Subtract by how far it is out of range (up to -15 points)
        over = max(0, listing.rent_price - renter.budget_max)
        under = max(0, renter.budget_min - listing.rent_price)
        penalty = min(15, ((over or under) / max(1, renter.budget_max - renter.budget_min)) * 15)
        score += max(0, 25 - penalty)

    # 2. Location: 15
    total += 15
    if listing.location in (renter.locations or []):
        score += 15
    else:
        score += 5 if listing.neighborhood_type in (renter.locations or []) else 0

    # 3. Bedrooms: 10
    total += 10
    if listing.bedrooms >= renter.bedrooms:
        score += 10
    else:
        score += max(0, 10 - 4 * (renter.bedrooms - listing.bedrooms))

    # 4. Bathrooms: 10
    total += 10
    if listing.bathrooms >= renter.bathrooms:
        score += 10
    else:
        score += max(0, 10 - 4 * (renter.bathrooms - listing.bathrooms))

    # 5. Amenities: 15
    total += 15
    renter_amenities = set(renter.amenities or [])
    listing_amenities = set(listing.amenities or [])
    matches = len(renter_amenities & listing_amenities)
    wanted = len(renter_amenities)
    score += 15 * (matches / wanted) if wanted else 0

    # 6. Lease Length: 10
    total += 10
    if renter.lease_length and listing.lease_length:
        diff = abs(renter.lease_length - listing.lease_length)
        score += max(0, 10 - 3 * diff)
    else:
        score += 5

    # 7. Pets Allowed: 10 (Hard stance if mismatch, but not zero)
    total += 10
    if renter.pets_allowed:
        if listing.pets_allowed:
            score += 10
        else:
            score += 2  # Strong penalty, but not zero
    else:
        score += 10  # Renter doesn't need pets allowed

    # 8. Move-in Date: 5 (Can be more precise if desired)
    total += 5
    score += 5  # Skip for now, or refine later

    # 9. Landlord tenant prefs (hard but partial)
    if landlord_prefs:
        for pref in landlord_prefs.tenant_preferences or []:
            if pref == "no_pets" and renter.pets_allowed:
                score -= 6  # Significant penalty
            if pref == "no_students" and getattr(renter, "is_student", False):
                score -= 5
            # Add more rules as needed

    # Bound score between 0 and total
    score = max(0, min(score, total))
    return round(score / total, 3)  # Return as 0-1 float
