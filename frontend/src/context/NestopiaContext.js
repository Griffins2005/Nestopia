import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from './authContext';
import {
  getAllListings,
  createListing as apiCreate,
  updateListing as apiUpdate,
  deleteListing as apiDelete,
  getSavedListings,
  saveListing,
  unsaveListing,
} from '../api/listings';
import { getRenterPreferences, setRenterPreferences } from '../api/preferences';

const NestopiaContext = createContext(null);

export const normalizeListing = (l) => {
  const landlord = l.landlord || {};
  const lat = l.latitude ?? l.lat ?? null;
  const lng = l.longitude ?? l.lng ?? null;
  const houseRules = Array.isArray(l.house_rules)
    ? l.house_rules.join(', ')
    : l.house_rules;

  return {
    ...l,
    image: l.images?.[0] || l.image || '/assets/default-house.png',
    match_breakdown: l.match_breakdown ?? null,
    match_score: l.match_breakdown?.overall ?? l.match_score ?? null,
    lat,
    lng,
    amenities: l.amenities || [],
    tenant_preferences: l.tenant_preferences || [],
    tenant_custom_requirements: l.tenant_custom_requirements || [],
    pets: l.pets || (l.pets_allowed === false ? 'No pets' : l.pets_allowed ? 'Pet-friendly' : undefined),
    house_rules: houseRules || l.house_rules,
    lease_length: typeof l.lease_length === 'number' ? `${l.lease_length} months` : l.lease_length,
    host: l.host || {
      name: landlord.name || l.landlord_name || l.owner_name || 'Host',
      id: landlord.id,
      since: String(new Date(landlord.created_at || l.created_at || Date.now()).getFullYear()),
      email: landlord.email || l.landlord_email || l.contact_email || '',
      phone: landlord.phone || l.landlord_phone || l.contact_phone || '',
      contact_preference: landlord.contact_preference || 'any',
      profilePicture: landlord.profilePicture || landlord.avatar || '',
    },
  };
};

const normalizePreferences = (p) => {
  if (!p || Object.keys(p).length === 0) return null;
  return {
    ...p,
    household: p.household ?? p.household_size ?? 1,
    move_in: p.move_in ?? p.move_in_date ?? '',
    pets: p.pets ?? (p.pets_allowed === false ? 'No pets' : 'Dog'),
    lease_length: typeof p.lease_length === 'number' ? `${p.lease_length} months` : (p.lease_length || '12 months'),
  };
};

export function NestopiaProvider({ children }) {
  const auth = useContext(AuthContext);
  const user = auth?.loading ? null : (auth?.user ?? null);

  const [listings, setListings] = useState([]);
  const [listingsStatus, setListingsStatus] = useState('loading');
  const [savedIds, setSavedIds] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [toast, setToast] = useState(null);

  const loadListings = useCallback((viewAsRenter = false) => {
    setListingsStatus('loading');
    return getAllListings(viewAsRenter)
      .then((res) => {
        const data = (res.data || []).map(normalizeListing);
        setListings(data);
        setListingsStatus('ready');
        return data;
      })
      .catch(() => {
        setListings([]);
        setListingsStatus('unavailable');
        return [];
      });
  }, []);

  useEffect(() => {
    loadListings(false);
  }, [loadListings, user?.id, user?.role]);

  useEffect(() => {
    if (auth?.loading) return;
    if (!user) {
      setSavedIds([]);
      setPreferences(null);
      return;
    }
    getSavedListings()
      .then((res) => {
        const ids = (res.data || []).map((item) => item.listing?.id ?? item.id);
        setSavedIds(ids);
      })
      .catch(() => setSavedIds([]));
  }, [auth?.loading, user]);

  useEffect(() => {
    if (auth?.loading) return;
    if (!user || user?.role !== 'renter') {
      if (user?.role !== 'renter') setPreferences(null);
      return;
    }
    getRenterPreferences()
      .then((res) => {
        const normalized = normalizePreferences(res.data);
        if (normalized) setPreferences(normalized);
        else setPreferences(null);
      })
      .catch(() => setPreferences(null));
  }, [auth?.loading, user]);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const toggleSave = useCallback(async (id) => {
    if (!user) return;
    if (savedIds.includes(id)) {
      await api.delete(`/api/listings/saved/${id}`);
      setSavedIds((ids) => ids.filter((x) => x !== id));
    } else {
      await saveListing(id);
      setSavedIds((ids) => [...ids, id]);
    }
  }, [user, savedIds]);

  const addListing = useCallback(async (data) => {
    const res = await apiCreate(data);
    const created = normalizeListing(res.data);
    setListings((ls) => [created, ...ls]);
    return created;
  }, []);

  const updateListing = useCallback(async (id, patch) => {
    const res = await apiUpdate(id, patch);
    const updated = normalizeListing(res.data);
    setListings((ls) => ls.map((l) => (l.id === id ? updated : l)));
  }, []);

  const deleteListing = useCallback(async (id) => {
    await apiDelete(id);
    setListings((ls) => ls.filter((l) => l.id !== id));
    setSavedIds((ids) => ids.filter((x) => x !== id));
  }, []);

  const savePreferences = useCallback(async (prefs) => {
    await setRenterPreferences(prefs);
    const normalized = normalizePreferences(prefs);
    setPreferences(normalized);
    if (auth?.refreshProfile) await auth.refreshProfile();
  }, [auth]);

  return (
    <NestopiaContext.Provider value={{
      user,
      logout: auth?.logout,
      listings,
      listingsStatus,
      loadListings,
      retryListings: () => loadListings(false),
      addListing,
      updateListing,
      deleteListing,
      savedIds,
      toggleSave,
      preferences,
      savePreferences,
      toast,
      flashToast,
    }}>
      {children}
    </NestopiaContext.Provider>
  );
}

export function useNestopia() {
  return useContext(NestopiaContext);
}
