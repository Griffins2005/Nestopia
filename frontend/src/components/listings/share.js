//src/components/listings/share.js 
import React, { useState, useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi"; // ← Add cancel icon

export default function ShareButton({ listingId }) {
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef(null);

  const url = `${window.location.origin}/listing/${listingId}`;

  const handleShare = async (e) => {
    e.preventDefault();
    if (copied) {
      // Cancel (hide tooltip immediately)
      setCopied(false);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out this property!", url });
      } catch (err) {
        // user cancelled native share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Hide tooltip after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        className="icon-btn"
        title={copied ? "Cancel" : "Share"}
        onClick={handleShare}
        ref={tooltipRef}
        aria-label={copied ? "Cancel sharing" : "Share listing"}
      >
        {copied ? <FiX /> : <FiUpload />}
      </button>
      {copied && (
        <span
          style={{
            position: "absolute",
            top: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#222c38",
            color: "#fff",
            fontSize: "0.98em",
            padding: "5px 13px",
            borderRadius: "8px",
            boxShadow: "0 2px 12px #0012",
            zIndex: 11,
            whiteSpace: "nowrap",
          }}
        >
          Link copied!
        </span>
      )}
    </span>
  );
}

