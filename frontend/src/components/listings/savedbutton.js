// src/components/listings/savedbutton.js
// src/components/listings/savedbutton.js
import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import axios from "axios";
import { FiHeart } from "react-icons/fi";

export default function SavedButton({ listingId, initiallySaved, onUnsave }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [saved, setSaved] = useState(!!initiallySaved);
  const [alertMsg, setAlertMsg] = useState("");

  const toggleSave = async (e) => {
    e.preventDefault();
    if (!user || !user.accessToken) {
      navigate("/login", {
        state: {
          from: { pathname: location.pathname },
          message: "Please sign in or create an account to save listings.",
        },
      });
      return;
    }

    if (saved) {
      // Remove from saved listings
      await axios.delete(`/api/listings/saved/${listingId}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      setSaved(false);
      if (onUnsave) onUnsave(listingId); // Callback to remove from saved listings page
    } else {
      // Save - only allow once
      try {
        await axios.post(`/api/listings/saved/${listingId}`, {}, {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        setSaved(true);
        setAlertMsg("Listing saved!");
        setTimeout(() => setAlertMsg(""), 1800);
      } catch (err) {
        setAlertMsg("Listing is already saved!");
        setTimeout(() => setAlertMsg(""), 1800);
      }
    }
  };
  // style={{ position: "relative", display: "inline-block" }}
  return (
    <span> 
      <button className={`icon-btn${saved ? " saved" : ""}`} title={saved ? "Unsave" : "Save"}
        onClick={toggleSave} style={saved ? { color: "#e54848" } : {}} >
        <FiHeart />
      </button>
      {alertMsg && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "110%",
            transform: "translateX(-50%)",
            background: "#fff",
            color: "#e54848",
            fontSize: "0.98em",
            borderRadius: "8px",
            padding: "2px 15px",
            boxShadow: "0 2px 8px #0012",
            zIndex: 12,
            marginTop: 4,
            fontWeight: 600
          }}
        >
          {alertMsg}
        </span>
      )}
    </span>
  );
}
