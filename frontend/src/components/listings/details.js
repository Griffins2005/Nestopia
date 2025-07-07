// src/components/listings/details.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../../context/authContext";
import SavedButton from "./savedbutton";
import ShareButton from "./share";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaCheckCircle, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import avatar from "../../images/avatar.png";

export default function ListingDetail() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [startingChat, setStartingChat] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((res) => res.json())
      .then((data) => setListing(data));
  }, [id]);

  if (!listing) return <div>Loading…</div>;

  // Images logic
  const images = Array.isArray(listing.images) && listing.images.length
    ? listing.images
    : ["https://via.placeholder.com/500?text=No+images"];
  const atFirst = imgIdx === 0;
  const atLast = imgIdx === images.length - 1;
  const handlePrev = () => setImgIdx((i) => (i > 0 ? i - 1 : i));
  const handleNext = () => setImgIdx((i) => (i < images.length - 1 ? i + 1 : i));
  const handleThumb = (i) => setImgIdx(i);

  const landlord = listing.landlord || {};
  const landlordId = landlord.id;
  const calendly = landlord.calendly_link || "";
  const availableFrom = listing.available_from
    ? new Date(listing.available_from).toLocaleDateString()
    : "-";
  const matchScore = Math.round((listing.match_score || 0) * 100);
  const landlordName = landlord.name || "Host";
  const landlordEmail = landlord.email || "N/A";
  const landlordAvatar = landlord.profilePicture || avatar;
  const landlordSince = landlord.created_at
    ? new Date(landlord.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "N/A";
  const verified = landlord.verified || false;
  const responseRate = landlord.response_rate || "N/A";
  const responseTime = landlord.response_time || "N/A";

  const handleMessageOwner = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!user.id || !landlordId || !listing.id) {
      setErrorMsg("Something went wrong. Missing user or landlord info.");
      return;
    }
    setStartingChat(true);
    setErrorMsg("");
    try {
      // Build payload: only include fields required by backend
      const payload = {
        listing_id: listing.id,
        renter_id: user.role === "renter" ? user.id : undefined,
        landlord_id: landlordId,
      };
      // Remove undefined fields so FastAPI doesn't receive them as null
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const res = await fetch("/api/chats/conversations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (Array.isArray(result)) {
          setErrorMsg(result.map((e) => e.msg).join("; "));
        } else if (result.detail) {
          setErrorMsg(result.detail);
        } else {
          setErrorMsg("Failed to start chat.");
        }
        setStartingChat(false);
        return;
      }
      // You can redirect to `/chat/${result.id}` if you want a 1:1 chat page per conversation
      navigate("/chat");
    } catch (e) {
      setErrorMsg("Network error, please try again.");
      setStartingChat(false);
    }
  };

  const showMessageOwnerBtn = user && user.role === "renter";

  return (
    <div className="listing-detail-wrapper">
      <div className="listing-detail-main">
        {/* Back button */}
        <button className="back-to-listings-btn" onClick={() => navigate("/listings")}>
          <FiArrowLeft size={22} /> Back to listings
        </button>

        {/* Image carousel */}
        <div className="carousel-main-image">
          <img
            src={images[imgIdx]}
            alt={listing.title}
            className="detail-main-img"
          />
          {images.length > 1 && (
            <>
              <button
                className={`carousel-arrow carousel-arrow-left${atFirst ? " disabled" : ""}`}
                onClick={handlePrev}
                disabled={atFirst}
                aria-label="Previous image"
              >
                <FiChevronLeft size={28} />
              </button>
              <button
                className={`carousel-arrow carousel-arrow-right${atLast ? " disabled" : ""}`}
                onClick={handleNext}
                disabled={atLast}
                aria-label="Next image"
              >
                <FiChevronRight size={28} />
              </button>
              <div className="carousel-count">{imgIdx + 1} / {images.length}</div>
            </>
          )}
        </div>
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="carousel-thumbs-row">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Preview ${i + 1}`}
                className={`carousel-thumb-img${imgIdx === i ? " active" : ""}`}
                onClick={() => handleThumb(i)}
              />
            ))}
          </div>
        )}

        {/* Title, Icons, Location */}
        <div className="detail-header-row">
          <h1>{listing.title}</h1>
          <div className="detail-icons">
            <SavedButton listingId={listing.id} initiallySaved={listing.saved} />
            <ShareButton listingId={listing.id} />
          </div>
        </div>
        <div className="detail-subrow">
          <span className="detail-location">
            <FaMapMarkerAlt style={{ marginRight: 4 }} />
            {listing.location}
          </span>
          <span className="detail-specs">
            {listing.bedrooms} beds · {listing.bathrooms} baths
            {listing.sqft && <> · {listing.sqft} sqft</>}
            {listing.rating && (
              <>
                {" · "}
                <FaStar color="#FFC120" style={{ marginRight: 1 }} />
                {listing.rating} ({listing.num_reviews} reviews)
              </>
            )}
          </span>
        </div>

        {/* About */}
        <section className="detail-section">
          <h2>About this home</h2>
          <p>{listing.description}</p>
        </section>

        {/* Amenities */}
        <section className="detail-section">
          <h2>Amenities</h2>
          <div className="amenities-list">
            {(listing.amenities || []).map((a) => (
              <div className="amenity-item" key={a}>
                <FaCheckCircle className="amenity-check" /> {a}
              </div>
            ))}
          </div>
        </section>

        {/* Availability & Building Features */}
        <section className="detail-section">
          <h2>Availability</h2>
          <div className="detail-section-row">
            <span><b>Available from:</b> {availableFrom}</span>
            <span><b>Lease terms:</b> {listing.lease_terms || "12 months"}</span>
            <span><b>Pets allowed:</b> {listing.pets_allowed ? "Yes" : "No"}</span>
          </div>
          {listing.building_features && (
            <>
              <h2>Building Features</h2>
              <div className="amenities-list">
                {listing.building_features.map((a) => (
                  <div className="amenity-item" key={a}>
                    <FaCheckCircle className="amenity-check" /> {a}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Right column: Info Card */}
      <div className="detail-side-card">
        <div className="detail-price-row">
          <span className="detail-price">${listing.rent_price?.toLocaleString() || "--"}</span>
          <span className="detail-price-unit">/month</span>
        </div>
        <div className="detail-match-badge">{matchScore}% Match</div>
        <div className="token-progress">
          <div className="token-progress-label">Token Progress</div>
          <div className="token-progress-bar-bg">
            <div className="token-progress-bar" style={{ width: `${Math.max(10, matchScore)}%` }} />
          </div>
          <span className="token-progress-msg">Unlock property visit at 100%!</span>
        </div>
        <div className="detail-side-btns">
          {showMessageOwnerBtn && (
            <button
              className="primary-btn"
              onClick={handleMessageOwner}
              disabled={startingChat}
            >
              {startingChat ? "Starting chat..." : "Message Owner"}
            </button>
          )}
          <button
            className="secondary-btn"
            disabled={!calendly}
            onClick={() => calendly && window.open(calendly, "_blank")}
          >
            Schedule Tour
          </button>
          {!calendly && (
            <div className="no-calendly-msg">
              The landlord has not provided a tour scheduling link.<br />
              Please message the owner for more info.
            </div>
          )}
          {errorMsg && (
            <div className="listing-error-msg">
              {Array.isArray(errorMsg)
                ? errorMsg.map((m, i) => <div key={i}>{m}</div>)
                : errorMsg}
            </div>
          )}
        </div>
        <div className="landlord-card">
          <img
            src={landlordAvatar}
            alt={landlordName}
            className="landlord-avatar"
          />
          <div className="landlord-info">
            <div className="landlord-name">{landlordName}</div>
            <div className="landlord-email">{landlordEmail}</div>
            <div className="landlord-since">Member since {landlordSince}</div>
            {verified && (
              <span className="landlord-verified">
                <FaCheckCircle /> Verified Host
              </span>
            )}
          </div>
        </div>
        <div className="landlord-stats">
          <div><b>Response rate:</b> {responseRate}%</div>
          <div><b>Response time:</b> {responseTime}</div>
        </div>
        <div className="renter-protection-note">
          This listing is protected by our <a href="/renter-protection">Renter Protection Policy</a>
        </div>
      </div>
    </div>
  );
}
