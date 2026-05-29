import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { createOsmMap } from '../api/geo';
import { getListingMatchPercent } from '../api/matches';

function formatPinPrice(rent) {
  if (rent == null) return '—';
  if (rent >= 1000) return `$${(rent / 1000).toFixed(1)}k`;
  return `$${rent}`;
}

export default function ListingsMap({ listings, isRenter, onSelect }) {
  const navigate = useNavigate();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [focused, setFocused] = useState(listings[0] || null);

  const validListings = useMemo(
    () => listings.filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number'),
    [listings]
  );

  useEffect(() => {
    if (listings.length === 0) {
      setFocused(null);
      return;
    }
    setFocused((current) => {
      if (!current || !listings.find((l) => l.id === current.id)) {
        return listings[0];
      }
      return current;
    });
  }, [listings]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    mapRef.current = createOsmMap(mapEl.current, { scrollWheelZoom: false });
    setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!validListings.length) return;

    validListings.forEach((listing) => {
      const matchScore = getListingMatchPercent(listing);
      const html = `
        <div class="map-pin">
          <span class="map-pin-price">${formatPinPrice(listing.rent_price)}</span>
          ${isRenter && matchScore ? `<span class="map-pin-match">${matchScore}%</span>` : ''}
        </div>`;
      const icon = L.divIcon({
        className: 'map-pin-wrap',
        html,
        iconSize: [78, 36],
        iconAnchor: [39, 36],
      });
      const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);
      marker.on('click', () => setFocused(listing));
      markersRef.current.push(marker);
    });

    const group = L.featureGroup(markersRef.current);
    map.fitBounds(group.getBounds().pad(0.25), { animate: false, maxZoom: 12 });
  }, [validListings, isRenter]);

  const handleSelect = (listing) => {
    if (onSelect) onSelect(listing);
    else navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="listings-map-shell">
      <div className="listings-map-panel">
        <div ref={mapEl} className="listings-map" />
        {listings.length > 0 && validListings.length === 0 && (
          <div className="listings-map-overlay">
            <p>No map pins yet — listings need a location from search when created.</p>
          </div>
        )}
      </div>
      <aside className="listings-map-side">
        <p className="map-side-label">
          {validListings.length} of {listings.length}{' '}
          {listings.length === 1 ? 'home' : 'homes'} on the map
        </p>
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
                <span className="map-side-price">
                  ${focused.rent_price?.toLocaleString()}<small>/mo</small>
                </span>
                {isRenter && getListingMatchPercent(focused) ? (
                  <span className="map-side-match">{getListingMatchPercent(focused)}% match</span>
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
              type="button"
              className={`map-side-row ${focused?.id === l.id ? 'active' : ''}`}
              onClick={() => {
                setFocused(l);
                if (mapRef.current && typeof l.lat === 'number') {
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
