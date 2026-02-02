# app/utils/ml_match.py
"""
AI-Enhanced Matching System
Combines rule-based scoring with machine learning for smarter matches.

Key improvements:
1. Learning from user behavior (saves, visits)
2. Semantic matching for text fields (descriptions, tags)
3. Adaptive weighting per user
4. Collaborative filtering signals
5. Feature engineering for better location/time matching
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
import json

# For semantic matching (optional - requires sentence-transformers)
try:
    from sentence_transformers import SentenceTransformer
    SEMANTIC_AVAILABLE = True
except ImportError:
    SEMANTIC_AVAILABLE = False
    print("Warning: sentence-transformers not installed. Semantic matching disabled.")


class SmartMatcher:
    """
    Enhanced matching that learns from user behavior and uses ML techniques.
    """
    
    def __init__(self, use_semantic: bool = False):
        self.use_semantic = use_semantic and SEMANTIC_AVAILABLE
        if self.use_semantic:
            # Lightweight model for text similarity
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Base weights (can be learned per-user)
        self.base_weights = {
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
            "behavioral_signal": 15,  # New: learned from user actions
            "semantic_match": 10,      # New: text similarity
        }
    
    def compute_enhanced_score(
        self,
        renter,
        landlord_prefs,
        listing,
        user_behavior: Optional[Dict] = None,
        similar_users_prefs: Optional[List] = None
    ) -> Tuple[float, Dict]:
        """
        Compute enhanced compatibility score with ML features.
        
        Returns:
            (score, explanation_dict) - score 0-1, and breakdown for transparency
        """
        from app.utils.match import compute_compatibility_score
        
        # 1. Base rule-based score (maintains existing logic)
        base_score = compute_compatibility_score(renter, landlord_prefs, listing)
        
        # 2. Behavioral signal (learned from user actions)
        behavioral_boost = self._compute_behavioral_signal(
            renter, listing, user_behavior
        )
        
        # 3. Semantic matching (text similarity)
        semantic_score = self._compute_semantic_match(
            renter, listing
        ) if self.use_semantic else 0.5
        
        # 4. Collaborative filtering signal
        collab_score = self._compute_collaborative_signal(
            renter, listing, similar_users_prefs
        ) if similar_users_prefs else 0.5
        
        # 5. Feature engineering improvements
        location_boost = self._enhanced_location_match(renter, listing)
        timing_boost = self._enhanced_timing_match(renter, listing)
        
        # Combine signals (weighted ensemble)
        enhanced_score = (
            base_score * 0.60 +  # Base score still primary
            behavioral_boost * 0.20 +
            semantic_score * 0.10 +
            collab_score * 0.05 +
            (location_boost + timing_boost) / 2 * 0.05
        )
        
        explanation = {
            "base_score": round(base_score, 3),
            "behavioral_boost": round(behavioral_boost, 3),
            "semantic_score": round(semantic_score, 3),
            "collaborative_signal": round(collab_score, 3),
            "location_boost": round(location_boost, 3),
            "timing_boost": round(timing_boost, 3),
            "final_score": round(enhanced_score, 3)
        }
        
        return min(1.0, max(0.0, enhanced_score)), explanation
    
    def _compute_behavioral_signal(
        self,
        renter,
        listing,
        user_behavior: Optional[Dict]
    ) -> float:
        """
        Learn from user's past actions:
        - Saved similar listings? → boost
        - Requested visits? → strong signal
        - Ignored listings with similar features? → penalty
        """
        if not user_behavior:
            return 0.5  # Neutral if no data
        
        score = 0.5
        user_id = getattr(renter, 'user_id', None) if hasattr(renter, 'user_id') else None
        
        # Check saved listings similarity
        saved_similarity = user_behavior.get('saved_similarity', 0)
        if saved_similarity > 0.7:
            score += 0.2
        elif saved_similarity > 0.5:
            score += 0.1
        
        # Visit requests are strongest signal
        visit_similarity = user_behavior.get('visit_similarity', 0)
        if visit_similarity > 0.7:
            score += 0.25
        
        # Negative signals (user ignored similar listings)
        ignored_similarity = user_behavior.get('ignored_similarity', 0)
        if ignored_similarity > 0.7:
            score -= 0.15
        
        return min(1.0, max(0.0, score))
    
    def _compute_semantic_match(self, renter, listing) -> float:
        """
        Use embeddings to match text fields semantically:
        - Custom preferences vs listing description/tags
        - Neighborhood descriptions
        - Free-text fields
        """
        if not self.use_semantic:
            return 0.5
        
        try:
            # Collect text from renter preferences
            renter_texts = []
            if hasattr(renter, 'custom_preferences') and renter.custom_preferences:
                renter_texts.extend(renter.custom_preferences)
            if hasattr(renter, 'locations') and renter.locations:
                renter_texts.extend(renter.locations)
            
            # Collect text from listing
            listing_texts = []
            if hasattr(listing, 'description') and listing.description:
                listing_texts.append(listing.description)
            if hasattr(listing, 'custom_tags') and listing.custom_tags:
                listing_texts.extend(listing.custom_tags)
            if hasattr(listing, 'neighborhood_description') and listing.neighborhood_description:
                listing_texts.append(listing.neighborhood_description)
            
            if not renter_texts or not listing_texts:
                return 0.5
            
            # Compute embeddings
            renter_emb = self.semantic_model.encode(renter_texts, convert_to_numpy=True)
            listing_emb = self.semantic_model.encode(listing_texts, convert_to_numpy=True)
            
            # Average embeddings
            renter_avg = np.mean(renter_emb, axis=0)
            listing_avg = np.mean(listing_emb, axis=0)
            
            # Cosine similarity
            similarity = np.dot(renter_avg, listing_avg) / (
                np.linalg.norm(renter_avg) * np.linalg.norm(listing_avg) + 1e-8
            )
            
            # Normalize to 0-1
            return (similarity + 1) / 2
            
        except Exception as e:
            print(f"Semantic matching error: {e}")
            return 0.5
    
    def _compute_collaborative_signal(
        self,
        renter,
        listing,
        similar_users_prefs: List
    ) -> float:
        """
        Collaborative filtering: "Users with similar preferences also liked..."
        """
        if not similar_users_prefs:
            return 0.5
        
        # Count how many similar users saved this listing
        positive_signals = sum(
            1 for user_data in similar_users_prefs
            if user_data.get('saved_listing_id') == getattr(listing, 'id', None)
        )
        
        if len(similar_users_prefs) == 0:
            return 0.5
        
        # Normalize
        return min(1.0, positive_signals / max(1, len(similar_users_prefs) * 0.3))
    
    def _enhanced_location_match(self, renter, listing) -> float:
        """
        Better location matching using:
        - Geographic proximity (if coordinates available)
        - Neighborhood profile overlap
        - Location name fuzzy matching
        """
        try:
            from app.utilis.geo import location_compatibility_score
        except ImportError:
            location_compatibility_score = None
        
        renter_locations = getattr(renter, 'locations', []) or []
        listing_location = getattr(listing, 'location', '') or ''
        
        if not renter_locations or not listing_location:
            return 0.5
        
        # Try geocoding-based proximity
        if location_compatibility_score:
            try:
                geo_score = location_compatibility_score(
                    renter_locations,
                    listing_location,
                    max_score=100,
                    threshold_km=10
                ) / 100.0
                if geo_score > 0:
                    return geo_score
            except:
                pass
        
        # Fallback to text matching
        listing_lower = listing_location.lower()
        for loc in renter_locations:
            if loc.lower() in listing_lower or listing_lower in loc.lower():
                return 0.8
        
        # Check neighborhood profile
        neighborhood_profile = getattr(listing, 'neighborhood_profile', []) or []
        if neighborhood_profile:
            profile_lower = {p.lower() for p in neighborhood_profile}
            for loc in renter_locations:
                if loc.lower() in profile_lower:
                    return 0.7
        
        return 0.3
    
    def _enhanced_timing_match(self, renter, listing) -> float:
        """
        Better move-in date matching with actual date parsing.
        """
        move_in_pref = (getattr(renter, 'move_in_date', '') or '').lower()
        available_from = getattr(listing, 'available_from', '') or ''
        
        if not move_in_pref or not available_from:
            return 0.5
        
        # Parse "ASAP", "Next month", etc.
        today = date.today()
        
        if move_in_pref in {'asap', 'immediately', 'flexible'}:
            return 0.9  # Flexible = high match
        
        # Try to parse dates
        try:
            if available_from and len(available_from) > 4:
                # Assume ISO format or similar
                avail_date = datetime.strptime(available_from[:10], '%Y-%m-%d').date()
                
                if move_in_pref == 'next month':
                    target_month = today.month + 1
                    if avail_date.month == target_month or avail_date <= today:
                        return 0.9
                
                # Check if available date is before or near move-in preference
                days_diff = abs((avail_date - today).days)
                if days_diff <= 30:
                    return 0.9
                elif days_diff <= 60:
                    return 0.7
                elif days_diff <= 90:
                    return 0.5
        except:
            pass
        
        # Fallback to text matching
        if move_in_pref in available_from.lower():
            return 0.8
        
        return 0.4


def compute_user_behavior_features(db, user_id: int, listing_id: int) -> Dict:
    """
    Extract behavioral features for a user-listing pair.
    Called from matching service to gather interaction data.
    """
    from app.db.models import SavedListing, VisitRequest
    
    features = {
        'saved_similarity': 0.0,
        'visit_similarity': 0.0,
        'ignored_similarity': 0.0,
    }
    
    # Check if user saved this exact listing
    saved = db.query(SavedListing).filter(
        SavedListing.user_id == user_id,
        SavedListing.listing_id == listing_id
    ).first()
    if saved:
        features['saved_similarity'] = 1.0
    
    # Check visit requests
    visit = db.query(VisitRequest).filter(
        VisitRequest.renter_id == user_id,
        VisitRequest.listing_id == listing_id
    ).first()
    if visit:
        features['visit_similarity'] = 1.0
    
    # TODO: Compute similarity to other saved listings
    # This would require comparing listing features
    
    return features


def find_similar_users(db, renter_prefs, limit: int = 10) -> List[Dict]:
    """
    Find users with similar preferences for collaborative filtering.
    """
    from app.db.models import RenterPreferences, SavedListing
    
    # Simple similarity: overlap in preferences
    renter_amenities = set(getattr(renter_prefs, 'amenities', []) or [])
    renter_locations = set(getattr(renter_prefs, 'locations', []) or [])
    
    similar_users = []
    
    # Get all other renters
    all_renters = db.query(RenterPreferences).filter(
        RenterPreferences.user_id != renter_prefs.user_id
    ).all()
    
    for other_renter in all_renters:
        other_amenities = set(getattr(other_renter, 'amenities', []) or [])
        other_locations = set(getattr(other_renter, 'locations', []) or [])
        
        # Compute Jaccard similarity
        amenity_overlap = len(renter_amenities & other_amenities) / max(
            1, len(renter_amenities | other_amenities)
        )
        location_overlap = len(renter_locations & other_locations) / max(
            1, len(renter_locations | other_locations)
        )
        
        similarity = (amenity_overlap + location_overlap) / 2
        
        if similarity > 0.3:  # Threshold
            saved = db.query(SavedListing).filter(
                SavedListing.user_id == other_renter.user_id
            ).all()
            
            similar_users.append({
                'user_id': other_renter.user_id,
                'similarity': similarity,
                'saved_listing_ids': [s.listing_id for s in saved],
            })
    
    # Sort by similarity and return top N
    similar_users.sort(key=lambda x: x['similarity'], reverse=True)
    return similar_users[:limit]

