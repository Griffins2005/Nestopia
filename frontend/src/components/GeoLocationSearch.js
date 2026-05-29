import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { searchPlaces, QUICK_LOCATION_PICKS, formatLocationLabel, locationKey, sameLocation } from '../api/geo';

/**
 * Free location search via OpenStreetMap (backend Nominatim proxy).
 * multiple=true → renter preferences (array of {label, lat, lng})
 * multiple=false → single listing address
 */
export default function GeoLocationSearch({
  value,
  onChange,
  error,
  multiple = true,
  addressMode = false,
  placeholder = 'Search any city, neighborhood, or address…',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  const selected = multiple
    ? (Array.isArray(value) ? value : [])
    : (value && typeof value === 'object' && value.label ? [value] : []);

  const singleLabel = !multiple && typeof value === 'string' ? value : formatLocationLabel(value);

  useEffect(() => {
    if (!multiple && typeof value === 'string') {
      setQuery(value);
    } else if (!multiple && value?.label) {
      setQuery(value.label);
    }
  }, [multiple, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const runSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchPlaces(q.trim(), addressMode ? 8 : 6, { preferAddresses: addressMode });
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [addressMode]);

  const onQueryChange = (text) => {
    setQuery(text);
    if (!multiple) {
      onChange({ label: text, lat: null, lng: null });
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 450);
  };

  const pick = (place) => {
    const entry = { label: place.label, lat: place.lat, lng: place.lng };
    if (multiple) {
      if (!selected.some((s) => sameLocation(s, entry))) {
        onChange([...selected, entry]);
      }
      setQuery('');
      setResults([]);
      setOpen(false);
    } else {
      onChange(entry);
      setQuery(entry.label);
      setOpen(false);
    }
  };

  const remove = (entry) => {
    if (!multiple) {
      onChange({ label: '', lat: null, lng: null });
      setQuery('');
      return;
    }
    onChange(selected.filter((s) => !sameLocation(s, entry)));
  };

  const addQuick = (place) => {
    if (multiple) {
      if (!selected.some((s) => sameLocation(s, place))) {
        onChange([...selected, place]);
      }
    } else {
      pick(place);
    }
  };

  const useTypedAddress = () => {
    const label = query.trim();
    if (label.length < 3) return;
    onChange({ label, lat: null, lng: null });
    setQuery(label);
    setOpen(false);
    setResults([]);
  };

  const showDropdown = open && (searching || results.length > 0 || query.trim().length >= 2);
  const canUseTyped = addressMode && !multiple && query.trim().length >= 3;

  return (
    <div className={`location-picker geo-location-search${error ? ' has-error' : ''}${addressMode ? ' address-mode' : ''}`} ref={wrapRef}>
      {multiple && selected.length > 0 && (
        <div className="location-selected">
          {selected.map((loc) => (
            <button type="button" key={locationKey(loc)} className="location-chip" onClick={() => remove(loc)}>
              {formatLocationLabel(loc)}
              <span className="location-chip-x" aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <div className="location-search-wrap">
        <Icon name="magnifying-glass" />
        <input
          className="form-input location-search"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          aria-label="Search locations"
          autoComplete="off"
        />
        {searching && <span className="geo-search-status">Searching…</span>}
      </div>

      {showDropdown && (
        <ul className="geo-results" role="listbox">
          {results.map((place) => (
            <li key={`${place.osm_id || place.label}-${place.lat}`}>
              <button type="button" className="geo-result-row" onClick={() => pick(place)}>
                <span className="geo-result-label">{place.label}</span>
                <span className="geo-result-type">{place.type}</span>
              </button>
            </li>
          ))}
          {!searching && results.length === 0 && query.trim().length >= 2 && (
            <li className="geo-result-empty">No matches found.</li>
          )}
        </ul>
      )}

      {canUseTyped && (
        <button type="button" className="cta-btn ghost small geo-use-address" onClick={useTypedAddress}>
          Use this address
        </button>
      )}

      {!multiple && singleLabel && !query && (
        <p className="form-hint geo-selected-hint">Selected: {singleLabel}</p>
      )}

      {!addressMode && (
        <div className="geo-quick-picks">
          <p className="geo-quick-label">Quick picks</p>
          <div className="chip-pick">
            {QUICK_LOCATION_PICKS.map((place) => {
              const active = multiple
                ? selected.some((s) => sameLocation(s, place))
                : sameLocation(value, place);
              return (
                <button
                  type="button"
                  key={locationKey(place)}
                  className={'pick' + (active ? ' active' : '')}
                  onClick={() => addQuick(place)}
                >
                  {active && <Icon name="circle-check" />} {place.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="geo-attribution">Location search powered by OpenStreetMap</p>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
