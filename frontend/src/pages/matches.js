// src/pages/matches.js
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import AuthContext from "../context/authContext";
import { getDailyMatches } from "../api/matches";
import ListingCard from "../components/listings/listingCard";
import house from "../images/default-house.png";

export default function MatchesPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isRenter = user?.role === "renter";

  useEffect(() => {
    if (!isRenter) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDailyMatches()
      .then((res) => {
        setMatches(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load your matches. Please try again later.");
        setLoading(false);
      });
  }, [isRenter]);

  const hasPreferences = Boolean(user?.renter_preferences);
  const topMatch = matches[0];
  const restMatches = matches.slice(1);

  // Landlord view
  if (!isRenter) {
    return (
      <div className="listings-shell">
        <section className="matches-hero">
          <div>
            <p className="eyebrow">Compatibility</p>
            <h1>Tenant Matches</h1>
            <p>
              As a landlord, your listings are matched to renters whose preferences
              align with your property. Set your tenant preferences to improve
              match quality.
            </p>
          </div>
          <Link to="/profile" className="cta-btn">
            Update preferences
          </Link>
        </section>
        <div className="matches-prompt">
          <div className="matches-prompt-icon">
            <FiStar />
          </div>
          <div>
            <h3>How matching works</h3>
            <p>
              Our AI compares your listing details with renter preferences — budget,
              bedrooms, amenities, and lifestyle. High-match renters get your
              listings surfaced first in their daily feed.
            </p>
          </div>
          <Link to="/listings" className="cta-btn">
            View my listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="listings-shell">
      <section className="matches-hero">
        <div>
          <p className="eyebrow">Daily picks</p>
          <h1>Your Matches</h1>
          <p>
            Homes curated for your budget, location, and lifestyle — refreshed
            every day.
          </p>
        </div>
        {!hasPreferences && (
          <Link to="/profile" className="cta-btn">
            Set preferences to improve matches
          </Link>
        )}
      </section>

      {!hasPreferences && (
        <div className="matches-prompt">
          <div className="matches-prompt-icon">
            <FiStar />
          </div>
          <div>
            <h3>Set your preferences</h3>
            <p>
              Tell us your budget, move-in date, and must-haves so we can surface
              the listings that actually feel like home.
            </p>
          </div>
          <Link to="/profile" className="cta-btn">
            Set preferences
          </Link>
        </div>
      )}

      {loading && (
        <div className="card-surface" style={{ textAlign: "center", padding: "2rem" }}>
          Finding your best matches…
        </div>
      )}

      {error && (
        <div className="form-error">{error}</div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="empty-shelf">
          <div className="empty-shelf-icon">
            <FiStar />
          </div>
          <h3>No matches yet</h3>
          <p>
            {hasPreferences
              ? "We couldn't find listings that match your preferences right now. Check back tomorrow — new homes are added daily."
              : "Set your renting preferences so we can find the right homes for you."}
          </p>
          <Link to={hasPreferences ? "/listings" : "/profile"} className="cta-btn">
            {hasPreferences ? "Browse all listings" : "Set preferences"}
          </Link>
        </div>
      )}

      {!loading && !error && topMatch && (
        <>
          <div
            className="top-match"
            onClick={() => navigate(`/listing/${topMatch.listing_id || topMatch.id}`)}
          >
            <div
              className="top-match-img"
              style={{
                backgroundImage: `url(${(topMatch.images && topMatch.images[0]) || house})`,
              }}
            >
              <div className="top-match-badge">
                {Math.round((topMatch.compatibility_score || topMatch.match_score || 0) * 100)}% Match
              </div>
            </div>
            <div className="top-match-body">
              <p className="eyebrow soft" style={{ marginBottom: "0.4rem" }}>
                Top pick for today
              </p>
              <h2>{topMatch.title}</h2>
              <p className="top-match-desc">
                {topMatch.description
                  ? topMatch.description.slice(0, 160) + (topMatch.description.length > 160 ? "…" : "")
                  : topMatch.location}
              </p>
              <div className="top-match-foot">
                <span className="top-match-price">
                  ${(topMatch.rent_price || 0).toLocaleString()}
                  <small>/mo</small>
                </span>
                <Link
                  to={`/listing/${topMatch.listing_id || topMatch.id}`}
                  className="cta-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  View details
                </Link>
              </div>
            </div>
          </div>

          {restMatches.length > 0 && (
            <>
              <div className="matches-list-head">
                <h2>More great fits</h2>
              </div>
              <div className="listings-grid">
                {restMatches.map((m) => (
                  <ListingCard
                    key={m.listing_id || m.id}
                    listing={{
                      id: m.listing_id || m.id,
                      title: m.title,
                      location: m.location,
                      rent_price: m.rent_price,
                      match_score: m.compatibility_score || m.match_score,
                      amenities: m.amenities || [],
                      images: m.images || [],
                      bedrooms: m.bedrooms,
                      bathrooms: m.bathrooms,
                      sqft: m.sqft,
                    }}
                    userRole="renter"
                    initiallySaved={false}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
