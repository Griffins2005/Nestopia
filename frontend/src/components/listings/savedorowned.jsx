import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaEllipsisV } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import AuthContext from "../../context/authContext";
import axios from "axios";

// Helper: time since
function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const created = new Date(date);
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

export default function SavedOrOwnedListingCard({ listing, userRole, onListingDeleted, onEditListing }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [manageOpen, setManageOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Saved listings for renter
  if (userRole === "renter") {
    const item = listing.listing ? listing.listing : listing;
    const priceString =
      typeof item.rent_price === "number"
        ? `$${item.rent_price.toLocaleString()}/month`
        : item.price || item.rent_price || "";

    return (
      <div className="listing-card-ntp">
        <div>
          <div className="listing-title-ntp">{item.title}</div>
          <div className="listing-location-ntp">{item.location}</div>
          <div className="listing-meta-row-ntp">
            <span className="listing-price-ntp">{priceString}</span>
          </div>
        </div>
        <div className="listing-side-ntp">
          <div className="listing-time-ntp">
            Saved {timeAgo(listing.saved_at || item.created_at)}
          </div>
          <div className="listing-btn">
            <button className="listing-btn-ntp" onClick={() => navigate(`/listing/${item.id}`)} > View Details </button>
            <button className="listing-btn-ntp"
              onClick={async () => {
              await axios.delete(`/api/listings/saved/${item.id}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
              });
              if (onListingDeleted) onListingDeleted(item.id);
              }}>
              <FiTrash2 />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Landlord owned listing card
  const priceString =
    typeof listing.rent_price === "number"
      ? `$${listing.rent_price.toLocaleString()}/month`
      : listing.price || listing.rent_price || "";

  const status =
    (listing.status ||
      (listing.is_rented ? "Rented" : "Available")).toLowerCase();

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/listings/${listing.id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      setShowDeleteConfirm(false);
      setConfirmChecked(false);
      if (onListingDeleted) onListingDeleted(listing.id);
    } catch {
      alert("Failed to delete listing.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="listing-card-ntp">
      <div>
        <div className="listing-title-ntp">{listing.title}</div>
        <div className="listing-location-ntp">{listing.location}</div>
        <div className="listing-meta-row-ntp">
          <span className="listing-price-ntp">{priceString}</span>
          <span className={`listing-status-badge-ntp ${status}`}>
            {status === "available" ? "Available" : "Rented"}
          </span>
        </div>
      </div>
      <div className="listing-side-ntp">
        <div className="listing-time-ntp">
          Posted {timeAgo(listing.created_at)}
        </div>
        <div className="listing-btns-ntp">
          <button
            className="listing-btn-ntp"
            onClick={() => navigate(`/listing/${listing.id}`)}
          >
            View Details
          </button>
          <div className="manage-dropdown-wrapper-ntp">
            <button
              className="listing-btn-ntp"
              onClick={() => setManageOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={manageOpen}
              aria-label="Manage listing"
              type="button"
            >
              <FaBuilding style={{ marginRight: 6, fontSize: "1.15em" }} />
              Manage
              <FaEllipsisV style={{ marginLeft: 7, fontSize: "1em" }} />
            </button>
            {manageOpen && (
              <div className="manage-dropdown-menu-ntp">
                <button
                  type="button"
                  onClick={() => {
                    setManageOpen(false);
                    if (onEditListing) onEditListing(listing);
                  }}
                >
                  Edit
                </button>
                <button
                  className="danger-btn-ntp"
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setManageOpen(false);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {showDeleteConfirm && (
          <div className="delete-confirm-modal-ntp">
            <div>
              <b>Delete this listing?</b>
              <div className="delete-warning-ntp">
                This action is permanent. Are you sure you want to delete <b>{listing.title}</b>?
                <br />
                <input
                  type="checkbox"
                  id={`delete-confirm-${listing.id}`}
                  onChange={e => setConfirmChecked(e.target.checked)}
                  checked={confirmChecked}
                />
                <label htmlFor={`delete-confirm-${listing.id}`}>
                  I understand and want to delete this listing
                </label>
              </div>
              <div className="delete-btn-row-ntp">
                <button
                  className="listing-btn-ntp"
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmChecked(false);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="listing-btn-ntp danger-btn-ntp"
                  type="button"
                  disabled={!confirmChecked || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
