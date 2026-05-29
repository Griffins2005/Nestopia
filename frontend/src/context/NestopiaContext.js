import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from './authContext';
import { getAllListings, createListing as apiCreate, updateListing as apiUpdate, deleteListing as apiDelete } from '../api/listings';
import { getRenterPreferences, setRenterPreferences } from '../api/preferences';
import axios from 'axios';

const NestopiaContext = createContext(null);

const normalizeListing = (l) => ({
  ...l,
  image: l.images?.[0] || l.image || '/assets/default-house.png',
  match_score: l.match_score || 0,
  lat: l.latitude || l.lat || null,
  lng: l.longitude || l.lng || null,
  amenities: l.amenities || [],
  host: l.host || {
    name: l.landlord_name || l.owner_name || 'Host',
    since: String(new Date(l.created_at || Date.now()).getFullYear()),
    email: l.landlord_email || l.contact_email || '',
    phone: l.landlord_phone || l.contact_phone || '',
  },
});

export function NestopiaProvider({ children }) {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;

  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getAllListings()
      .then(res => setListings((res.data || []).map(normalizeListing)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.accessToken) { setSavedIds([]); return; }
    axios.get('/api/listings/saved/', {
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      headers: { Authorization: `Bearer ${user.accessToken}` },
    })
      .then(res => setSavedIds((res.data || []).map(l => l.id || l)))
      .catch(() => setSavedIds([]));
  }, [user?.accessToken]);

  useEffect(() => {
    if (!user?.accessToken || user?.role !== 'renter') return;
    getRenterPreferences()
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) setPreferences(res.data);
      })
      .catch(() => {});
  }, [user?.accessToken, user?.role]);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const toggleSave = useCallback(async (id) => {
    if (!user?.accessToken) return;
    const headers = { Authorization: `Bearer ${user.accessToken}` };
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    if (savedIds.includes(id)) {
      await axios.delete(`${base}/api/listings/saved/${id}`, { headers });
      setSavedIds(ids => ids.filter(x => x !== id));
    } else {
      await axios.post(`${base}/api/listings/saved/${id}`, {}, { headers });
      setSavedIds(ids => [...ids, id]);
    }
  }, [user?.accessToken, savedIds]);

  const addListing = useCallback(async (data) => {
    const res = await apiCreate(data);
    const created = normalizeListing(res.data);
    setListings(ls => [created, ...ls]);
    return created;
  }, []);

  const updateListing = useCallback(async (id, patch) => {
    const res = await apiUpdate(id, patch);
    const updated = normalizeListing(res.data);
    setListings(ls => ls.map(l => l.id === id ? updated : l));
  }, []);

  const deleteListing = useCallback(async (id) => {
    await apiDelete(id);
    setListings(ls => ls.filter(l => l.id !== id));
    setSavedIds(ids => ids.filter(x => x !== id));
  }, []);

  const savePreferences = useCallback(async (prefs) => {
    await setRenterPreferences(prefs);
    setPreferences(prefs);
  }, []);

  return (
    <NestopiaContext.Provider value={{
      user,
      logout: auth?.logout,
      listings,
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
