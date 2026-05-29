import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { createOsmMap } from '../api/geo';

export default function ListingMiniMap({ lat, lng, label, height = 240 }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapEl.current || typeof lat !== 'number' || typeof lng !== 'number') return;

    const map = createOsmMap(mapEl.current, {
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.circleMarker([lat, lng], {
      radius: 10,
      color: '#0f7c5a',
      weight: 3,
      fillColor: '#0f7c5a',
      fillOpacity: 0.35,
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 60);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return (
    <section className="detail-section listing-mini-map-section">
      <h3>On the map</h3>
      {label && <p className="listing-mini-map-label">{label}</p>}
      <div ref={mapEl} className="listing-mini-map" style={{ height }} aria-label="Map showing listing location" />
    </section>
  );
}
