import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import SavedButton from "./savedbutton";
import ShareButton from "./share";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaCheckCircle, FaStar, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import avatar from "../../images/avatar.png";

export default function ListingDetail() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

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
  const calendly = landlord.calendly_link || "";
  const availableFrom = listing.available_from
    ? new Date(listing.available_from).toLocaleDateString()
    : "-";
  const matchScore = Math.round((listing.match_score || 0) * 100);
  const landlordName = landlord.name || "Host";
  const landlordEmail = (landlord.email || "").trim();
  const landlordPhoneRaw = landlord.phone || "";
  const landlordPhone = landlordPhoneRaw ? landlordPhoneRaw.trim() : "";
  const landlordAvatar = landlord.profilePicture || avatar;
  const landlordSince = landlord.created_at
    ? new Date(landlord.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "N/A";
  const verified = landlord.verified || false;
  const responseRate = landlord.response_rate || "N/A";
  const responseTime = landlord.response_time || "N/A";
  const landlordFirstName = landlordName.split(" ")[0] || landlordName;
  const emailSubject = encodeURIComponent(`Inquiry about ${listing.title || "your listing on Nestopia"}`);
  const renterDescriptor = (user?.name || user?.email || "a Nestopia renter").trim();
  const emailBody = encodeURIComponent(
    `Hi ${landlordFirstName || "there"},\n\nI'm ${renterDescriptor} and I just reviewed your listing on Nestopia. ` +
    `I'd love to learn more about availability, tour times, and next steps.\n\nThanks!\n${renterDescriptor}`
  );
  const emailHref = landlordEmail
    ? `mailto:${landlordEmail}?subject=${emailSubject}&body=${emailBody}`
    : null;
  const phoneHref = landlordPhone
    ? `tel:${landlordPhone.replace(/[^+\d]/g, "")}`
    : null;
  const hasContactDetails = Boolean(emailHref || phoneHref);

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
        <div className="detail-contact-block">
          <h3>Contact {landlordName}</h3>
          <p className="contact-note">
            {user
              ? "Hosts see your verified profile when you reach out. Tap a button below to reveal the secure email or phone channel."
              : "Create a free profile so hosts see your preferences before you email or call."}
          </p>
          <div className="contact-button-group">
            {emailHref && (
              <button
                className="primary-btn contact-btn"
                onClick={() => {
                  if (!user) {
                    navigate("/login", {
                      state: {
                        from: { pathname: location.pathname },
                        message: "Please sign in or create an account to contact landlords.",
                      },
                    });
                    return;
                  }
                  window.location.href = emailHref;
                }}
              >
                <FaEnvelope /> Email {landlordFirstName}
              </button>
            )}
            {phoneHref && (
              <button
                className="secondary-btn contact-btn"
                onClick={() => {
                  if (!user) {
                    navigate("/login", {
                      state: {
                        from: { pathname: location.pathname },
                        message: "Please sign in or create an account to contact landlords.",
                      },
                    });
                    return;
                  }
                  window.location.href = phoneHref;
                }}
              >
                <FaPhoneAlt /> Call or text {landlordFirstName}
              </button>
            )}
          </div>
          {!hasContactDetails && (
            <div className="contact-hint">
              This host hasn’t shared contact details yet. Save the listing to get notified when they update their profile.
            </div>
          )}
          {calendly ? (
            <button
              className="secondary-btn contact-btn full-width"
              onClick={() => window.open(calendly, "_blank")}
            >
              Schedule a tour
            </button>
          ) : (
            <div className="no-calendly-msg">
              The landlord has not provided a tour scheduling link. Use the email/phone buttons once available to arrange a visit.
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
            <div className="landlord-contact-note">
              {hasContactDetails
                ? "Contact details are shared securely when you tap Email or Call."
                : "Contact details pending — we’ll alert you when the host adds them."}
            </div>
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
