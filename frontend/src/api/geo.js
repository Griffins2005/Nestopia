import L from 'leaflet';
import api from './axiosConfig';

// --- API ---

export async function searchPlaces(q, limit = 6, { preferAddresses = false } = {}) {
  const res = await api.get('/api/geo/search', {
    params: { q, limit, prefer_addresses: preferAddresses },
  });
  return res.data?.results || [];
}

// --- Location helpers (renter prefs, forms) ---

export const QUICK_LOCATION_PICKS = [
  { label: 'Ithaca, NY', lat: 42.443, lng: -76.5019 },
  { label: 'Collegetown, Ithaca, NY', lat: 42.4422, lng: -76.4852 },
  { label: 'Brooklyn, NY', lat: 40.6782, lng: -73.9442 },
  { label: 'Manhattan, NY', lat: 40.7831, lng: -73.9712 },
  { label: 'Williamsburg, Brooklyn', lat: 40.7081, lng: -73.9571 },
  { label: 'Park Slope, Brooklyn', lat: 40.671, lng: -73.9814 },
  { label: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { label: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
  { label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { label: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { label: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { label: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
];

export function locationKey(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return `${loc.label}-${loc.lat}-${loc.lng}`;
}

export function formatLocationLabel(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return loc.label || '';
}

export function sameLocation(a, b) {
  const ka = locationKey(a);
  const kb = locationKey(b);
  return Boolean(ka && ka === kb);
}

// --- OpenStreetMap tiles (Leaflet) ---

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
export const DEFAULT_MAP_CENTER = [42.443, -76.502];
export const DEFAULT_MAP_ZOOM = 11;

export function addOsmTileLayer(map) {
  return L.tileLayer(OSM_TILE_URL, {
    maxZoom: 19,
    attribution: OSM_ATTRIBUTION,
  }).addTo(map);
}

export function createOsmMap(container, options = {}) {
  const {
    center = DEFAULT_MAP_CENTER,
    zoom = DEFAULT_MAP_ZOOM,
    scrollWheelZoom = false,
  } = options;
  const map = L.map(container, { zoomControl: true, scrollWheelZoom }).setView(center, zoom);
  addOsmTileLayer(map);
  return map;
}

export function boundsFromListings(listings) {
  const valid = (listings || []).filter(
    (l) => typeof l.lat === 'number' && typeof l.lng === 'number'
  );
  if (!valid.length) return null;
  return L.latLngBounds(valid.map((l) => [l.lat, l.lng]));
}
