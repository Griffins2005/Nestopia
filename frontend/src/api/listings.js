import api from './axiosConfig';
import { API_BASE_URL } from './getBaseUrl';

export function createListing(payload) {
  return api.post('/api/listings/', payload);
}

export function getAllListings(viewAsRenter = false) {
  const params = viewAsRenter ? { view_as_renter: true } : {};
  return api.get('/api/listings/', { params });
}

export function getMyListings() {
  return api.get('/api/listings/owned');
}

export function getListingById(listingId) {
  return api.get(`/api/listings/${listingId}`);
}

export function updateListing(listingId, payload) {
  return api.put(`/api/listings/${listingId}`, payload);
}

export function deleteListing(listingId) {
  return api.delete(`/api/listings/${listingId}`);
}

export function uploadListingImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/listings/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function listingImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function getListingImages(listing) {
  if (Array.isArray(listing?.images) && listing.images.length) {
    return listing.images.map(listingImageUrl);
  }
  if (listing?.image) return [listingImageUrl(listing.image)];
  return [listingImageUrl('/assets/default-house.png')];
}

/** Calm, unified empty-state copy for listings / matches / saved. */
export const NO_LISTINGS = {
  icon: 'compass',
  title: 'No matches or listings right now',
  description: 'Try again later.',
};

export const NO_MATCHES = {
  icon: 'sparkles',
  title: 'No matches or listings right now',
  description: 'Try again later.',
};

export function getListingsEmptyState({
  listingsStatus,
  isLandlordView,
  hasSearchQuery,
  onAddListing,
  onClearSearch,
}) {
  if (listingsStatus === 'loading') return { type: 'loading' };

  if (hasSearchQuery) {
    return {
      type: 'empty',
      icon: 'magnifying-glass',
      title: 'No homes match that search',
      description: 'Try a different keyword or clear your search.',
      primaryAction: onClearSearch ? { label: 'Clear search', onClick: onClearSearch } : undefined,
    };
  }

  if (isLandlordView) {
    return {
      type: 'empty',
      icon: 'plus',
      ...NO_LISTINGS,
      primaryAction: onAddListing ? { label: 'Add listing', onClick: onAddListing, icon: 'plus' } : undefined,
    };
  }

  return { type: 'empty', ...NO_LISTINGS };
}

export function getFeaturedEmptyState({ listingsStatus }) {
  if (listingsStatus === 'loading') return { type: 'loading' };
  return { type: 'empty', compact: true, ...NO_LISTINGS };
}

export function getSavedEmptyState({ loading, unavailable, onBrowse }) {
  if (loading) return { type: 'loading' };
  if (unavailable) return { type: 'empty', icon: 'heart', ...NO_LISTINGS };
  return {
    type: 'empty',
    icon: 'heart',
    title: 'Nothing saved yet',
    description: 'Heart a listing while you browse and it will show up here.',
    primaryAction: onBrowse ? { label: 'Browse homes', onClick: onBrowse, icon: 'arrow-right' } : undefined,
  };
}

export function getMatchesEmptyState({ hasPreferences }) {
  if (!hasPreferences) return null;
  return { type: 'empty', ...NO_MATCHES };
}
