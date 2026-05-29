import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

export default function ListingsMap({ listings, isRenter, onSelect }) {
  const navigate = useNavigate();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [focused, setFocused] = useState(listings[0] || null);

  useEffect(() => {
    if (listings.length === 0) { setFocused(null); return; }
    if (!focused || !listings.find((l) => l.id === focused.id)) setFocused(listings[0]);
  }, [listings]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView(
      [listings[0]?.lat ?? 40.68, listings[0]?.lng ?? -73.96], 5
    );
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const valid = listings.filter((l) => typeof l.lat === "number" && typeof l.lng === "number");
    if (!valid.length) return;

    valid.forEach((listing) => {
      const matchScore = Math.round((listing.match_score || 0) * 100);
      const html = `
        <div class="map-pin">
          <span class="map-pin-price">$${(listing.rent_price / 1000).toFixed(1)}k</span>
          ${isRenter && matchScore ? `<span class="map-pin-match">${matchScore}%</span>` : ""}
        </div>`;
      const icon = L.divIcon({
        className: "map-pin-wrap",
        html,
        iconSize: [78, 36],
        iconAnchor: [39, 36],
      });
      const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);
      marker.on("click", () => setFocused(listing));
      markersRef.current.push(marker);
    });

    const group = L.featureGroup(markersRef.current);
    map.fitBounds(group.getBounds().pad(0.25), { animate: false, maxZoom: 12 });
  }, [listings, isRenter]);

  const handleSelect = (listing) => {
    if (onSelect) onSelect(listing);
    else navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="listings-map-shell">
      <div ref={mapEl} className="listings-map" />
      <aside className="listings-map-side">
        <p className="map-side-label">{listings.length} {listings.length === 1 ? "home" : "homes"} on the map</p>
        {focused ? (
          <article className="map-side-card" onClick={() => handleSelect(focused)}>
            <div className="map-side-img" style={{ backgroundImage: `url(${focused.image || '/assets/default-house.png'})` }} />
            <div className="map-side-body">
              <p className="lc-sub">{focused.location}</p>
              <h3>{focused.title}</h3>
              <div className="map-side-meta">
                <span>{focused.bedrooms === 0 ? 'Studio' : `${focused.bedrooms} bd`}</span>
                <span>{focused.bathrooms} ba</span>
                {focused.sqft && <span>{focused.sqft} sqft</span>}
              </div>
              <div className="map-side-foot">
                <span className="map-side-price">${focused.rent_price?.toLocaleString()}<small>/mo</small></span>
                {isRenter && focused.match_score ? (
                  <span className="map-side-match">{Math.round(focused.match_score * 100)}% match</span>
                ) : null}
              </div>
            </div>
          </article>
        ) : (
          <p className="map-side-empty">Tap a pin to preview a listing.</p>
        )}

        <div className="map-side-list">
          {listings.map((l) => (
            <button
              key={l.id}
              className={`map-side-row ${focused?.id === l.id ? "active" : ""}`}
              onClick={() => {
                setFocused(l);
                if (mapRef.current && typeof l.lat === "number") {
                  mapRef.current.flyTo([l.lat, l.lng], 13, { duration: 0.5 });
                }
              }}
            >
              <span className="row-loc">{l.location}</span>
              <span className="row-price">${l.rent_price?.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
