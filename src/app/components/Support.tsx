import React, { useState, useEffect, useRef, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Phone, Heart, Navigation, ExternalLink, Search, Filter, Star, Compass, Bell, Lightbulb, Clock } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from './Button';
import { api } from '../../lib/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface SupportProps {
  onBack: () => void;
  onReturnToChat: () => void;
  onViewNotifications?: () => void;
}

interface Resource {
  name: string;
  type: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  distance?: string;
}

type FilterCategory = 'psychiatric' | 'wellness' | 'hospital' | 'clinic';

const FILTER_CONFIG: { key: FilterCategory; label: string; emoji: string; color: string; activeColor: string }[] = [
  { key: 'psychiatric', label: 'Psychiatric', emoji: '🧠', color: 'border-purple-200 bg-purple-50 text-purple-700', activeColor: 'border-purple-400 bg-purple-100 text-purple-800 ring-2 ring-purple-200' },
  { key: 'wellness', label: 'Wellness', emoji: '💚', color: 'border-teal-200 bg-teal-50 text-teal-700', activeColor: 'border-teal-400 bg-teal-100 text-teal-800 ring-2 ring-teal-200' },
  { key: 'hospital', label: 'Hospitals', emoji: '🏥', color: 'border-rose-200 bg-rose-50 text-rose-700', activeColor: 'border-rose-400 bg-rose-100 text-rose-800 ring-2 ring-rose-200' },
  { key: 'clinic', label: 'Clinics', emoji: '🩺', color: 'border-amber-200 bg-amber-50 text-amber-700', activeColor: 'border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-200' },
];

interface Helpline {
  name: string;
  phone?: string;
  description?: string;
  is_24_7?: boolean;
}

interface Initiative {
  name: string;
  phone: string;
  description: string;
  available: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

// Custom marker icons
const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px;
    background: #0d9488;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #0d9488, 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 2px #0d9488, 0 0 0 4px rgba(13,148,136,0.3); }
      50% { box-shadow: 0 0 0 2px #0d9488, 0 0 0 12px rgba(13,148,136,0); }
    }
  </style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function createFacilityIcon(type: string) {
  const isHospital = type === 'hospital';
  const color = isHospital ? '#dc2626' : '#0d9488';
  const symbol = isHospital ? '🏥' : '🧠';
  return new L.DivIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">${symbol}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Component to fit map bounds to all markers
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [positions, map]);
  return null;
}

// Component to fly to a specific point
function FlyToPoint({ position, trigger }: { position: [number, number] | null; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (position && trigger > 0) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, trigger, map]);
  return null;
}

// Error boundary to prevent map crashes from blanking the whole page
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Map render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-amber-700 text-sm font-medium">Map could not be loaded. Facilities are listed below.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Support({ onBack, onReturnToChat, onViewNotifications }: SupportProps) {
  const { addNotification, unreadCount } = useNotifications();
  const [quote, setQuote] = useState<{ quote: string; author?: string } | null>(null);
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [nearbyResources, setNearbyResources] = useState<Resource[]>([]);
  const [initiatives, setInitiatives] = useState<{ immediate: Initiative[]; support: Initiative[] }>({ immediate: [], support: [] });
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingHelplines, setLoadingHelplines] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedLocationName, setSearchedLocationName] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterCategory>>(new Set(['psychiatric', 'wellness', 'hospital', 'clinic']));
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mh_fav_facilities') || '[]')); }
    catch { return new Set(); }
  });
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const markerRefs = useRef<(L.Marker | null)[]>([]);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const data = await api.get<{ quote: string; author?: string }>('/api/support/quote');
        setQuote(data as { quote: string; author?: string });
      } catch {
        setQuote({ quote: 'You are stronger than you think.', author: 'Unknown' });
      } finally {
        setLoadingQuote(false);
      }
    }
    fetchQuote();
  }, []);

  useEffect(() => {
    async function fetchHelplines() {
      try {
        const data = await api.get<{ helplines: Helpline[] }>('/api/support/helplines');
        setHelplines((data as { helplines: Helpline[] }).helplines || []);
      } catch {
        setHelplines([]);
      } finally {
        setLoadingHelplines(false);
      }
    }
    fetchHelplines();
  }, []);

  useEffect(() => {
    async function fetchInitiatives() {
      try {
        const data = await api.get<{ immediate: Initiative[]; support: Initiative[] }>('/api/support/initiatives');
        const result = data as { immediate: Initiative[]; support: Initiative[] };
        setInitiatives({ immediate: result.immediate || [], support: result.support || [] });
      } catch {
        setInitiatives({ immediate: [], support: [] });
      }
    }
    fetchInitiatives();
  }, []);

  const handleFindNearby = async () => {
    setLoadingNearby(true);
    setError(null);
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        setLoadingNearby(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            const data = await api.get<{ resources: Resource[] }>(`/api/support/nearby?latitude=${latitude}&longitude=${longitude}`);
            const resources = (data as { resources: Resource[] }).resources || [];
            const mapped = resources.map((r) => ({
              ...r,
              distance: r.distance != null ? `${r.distance}` : undefined,
            }));
            setNearbyResources(mapped);
            if (mapped.length > 0) {
              const psychCount = mapped.filter(r => r.category === 'psychiatric').length;
              addNotification({
                type: 'success',
                title: `Found ${mapped.length} nearby support ${mapped.length === 1 ? 'facility' : 'facilities'}`,
                body: psychCount > 0
                  ? `Including ${psychCount} psychiatric ${psychCount === 1 ? 'hospital' : 'hospitals'} near you.`
                  : 'Mental health support is available near you.',
              });
            } else {
              addNotification({
                type: 'info',
                title: 'No facilities found nearby',
                body: 'Try searching a specific city or area using the search bar.',
              });
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to find nearby resources');
            setNearbyResources([]);
          } finally {
            setLoadingNearby(false);
          }
        },
        () => {
          setError('Location access denied. Please enable location to find nearby support.');
          setLoadingNearby(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Accept cached position up to 5 minutes old
        }
      );
    } catch {
      setLoadingNearby(false);
    }
  };

  const handleResourceClick = (resource: Resource, index: number) => {
    if (resource.latitude && resource.longitude) {
      setFlyTarget([resource.latitude, resource.longitude]);
      setFlyTrigger(prev => prev + 1);
      setSelectedIndex(index);
      // Open the popup for the clicked marker
      setTimeout(() => {
        const marker = markerRefs.current[index];
        if (marker) marker.openPopup();
      }, 1100);
    }
  };

  // Compute all marker positions for bounds fitting
  const allPositions = useMemo(() => {
    const positions: [number, number][] = [];
    if (userLocation) positions.push(userLocation);
    nearbyResources.forEach(r => {
      if (r.latitude && r.longitude) positions.push([r.latitude, r.longitude]);
    });
    return positions;
  }, [userLocation, nearbyResources]);

  const showMap = userLocation !== null;

  const filteredResources = useMemo(() => {
    return nearbyResources.filter(r => activeFilters.has((r.category || 'clinic') as FilterCategory));
  }, [nearbyResources, activeFilters]);

  const toggleFilter = (key: FilterCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Unique key per facility for favorites
  const resourceKey = (r: Resource) => `${r.name}|${r.latitude}|${r.longitude}`;

  const toggleFavorite = (r: Resource, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      const key = resourceKey(r);
      const adding = !next.has(key);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('mh_fav_facilities', JSON.stringify([...next]));
      if (adding) {
        addNotification({
          type: 'success',
          title: 'Saved to favourites',
          body: `${r.name} has been added to your favourites.`,
        });
      }
      return next;
    });
  };

  const getDirections = (r: Resource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!r.latitude || !r.longitude) return;
    // Opens Google Maps directions (works on mobile too — redirects to native Maps app)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}&travelmode=driving`;
    window.open(url, '_blank', 'noopener');
  };

  // Saved favourites from all-time search results (persisted in state during session)
  const [allSeenResources, setAllSeenResources] = useState<Resource[]>([]);
  useEffect(() => {
    if (nearbyResources.length > 0) {
      setAllSeenResources(prev => {
        const existing = new Map(prev.map(r => [resourceKey(r), r]));
        nearbyResources.forEach(r => existing.set(resourceKey(r), r));
        return [...existing.values()];
      });
    }
  }, [nearbyResources]);

  const favouriteResources = useMemo(() =>
    allSeenResources.filter(r => favorites.has(resourceKey(r)))
    , [allSeenResources, favorites]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="font-semibold text-stone-800">Support Resources</span>
        <button
          onClick={onViewNotifications}
          className="relative p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Daily Quote */}
        {!loadingQuote && quote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Heart size={120} />
            </div>
            <p className="text-xl sm:text-2xl font-serif italic text-stone-700 mb-4 relative z-10 leading-relaxed">
              &quot;{quote.quote}&quot;
            </p>
            <div className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full tracking-wide uppercase">
              Daily Reminder
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center px-4">
          <p className="text-stone-500 font-medium leading-relaxed">
            If things feel heavy right now, reaching out for help is a strong step. There are people ready to listen and support you.
          </p>
        </motion.div>

        {/* 24/7 Helplines */}
        {!loadingHelplines && helplines.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">24/7 Helplines</h2>
            <div className="space-y-3">
              {helplines.map((hl, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex items-center justify-between hover:border-teal-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-50 text-teal-600 p-3 rounded-full">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800">{hl.name}</h3>
                      {hl.description && <p className="text-sm text-stone-500">{hl.description}</p>}
                      {hl.phone && <p className="text-xs text-stone-400 mt-1">{hl.phone}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Search & Find Support */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchQuery.trim() || loadingNearby) return;
              setLoadingNearby(true);
              setError(null);
              setSearchedLocationName(null);
              api.get<{ location: { latitude: number; longitude: number; displayName: string }; resources: Resource[] }>(
                `/api/support/search?query=${encodeURIComponent(searchQuery.trim())}`
              )
                .then((data) => {
                  const loc = data.location;
                  setUserLocation([loc.latitude, loc.longitude]);
                  setSearchedLocationName(loc.displayName || searchQuery);
                  // Fly map to the searched location
                  setFlyTarget([loc.latitude, loc.longitude]);
                  setFlyTrigger(prev => prev + 1);
                  const resources = data.resources || [];
                  setNearbyResources(
                    resources.map((r) => ({
                      ...r,
                      distance: r.distance != null ? `${r.distance}` : undefined,
                    }))
                  );
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : 'Could not find that location');
                  setNearbyResources([]);
                })
                .finally(() => setLoadingNearby(false));
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search a city or area (e.g. Ikeja, Lagos)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loadingNearby || !searchQuery.trim()}
              className="px-5 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white font-semibold rounded-2xl text-sm transition-all shadow-sm hover:shadow"
            >
              Search
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Find Near Me Button */}
          <Button variant="primary" className="w-full justify-center py-4 text-base" onClick={() => { setSearchedLocationName(null); handleFindNearby(); }} disabled={loadingNearby}>
            <Navigation size={18} className="mr-2" />
            {loadingNearby ? 'Finding nearby support...' : showMap ? 'Refresh Nearby Results' : 'Find Support Near Me'}
          </Button>

          {/* Searched location info */}
          {searchedLocationName && (
            <p className="text-xs text-stone-400 text-center">Showing results near: <span className="font-medium text-stone-600">{searchedLocationName}</span></p>
          )}
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <p className="text-rose-600 text-sm text-center">{error}</p>
          </motion.div>
        )}

        {/* Favourites Section */}
        {favouriteResources.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Your Favourites</h2>
            </div>
            <div className="space-y-2">
              {favouriteResources.map((r, i) => {
                const filterCfg = FILTER_CONFIG.find(f => f.key === (r.category || 'clinic'));
                return (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Star size={16} className="text-amber-400 fill-amber-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 text-sm truncate">{r.name}</p>
                        {r.address && r.address !== 'Address not available' && (
                          <p className="text-xs text-stone-400 truncate">{r.address}</p>
                        )}
                        {filterCfg && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${filterCfg.color}`}>{filterCfg.emoji} {filterCfg.label}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.latitude && r.longitude && (
                        <button onClick={(e) => getDirections(r, e)} className="p-2 rounded-xl bg-white border border-stone-200 hover:border-teal-300 text-stone-500 hover:text-teal-600 transition-all" title="Get directions">
                          <Compass size={14} />
                        </button>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all" title={`Call ${r.phone}`}>
                          <Phone size={12} /><span>Call</span>
                        </a>
                      )}
                      <button onClick={(e) => toggleFavorite(r, e)} className="p-2 rounded-xl bg-white border border-amber-200 text-amber-400 hover:text-stone-400 transition-all" title="Remove from favourites">
                        <Star size={14} className="fill-amber-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Filter Toggles — shown after results load */}
        {nearbyResources.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Filter size={14} className="text-stone-400" />
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Filter by type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_CONFIG.map(f => {
                const isActive = activeFilters.has(f.key);
                const count = nearbyResources.filter(r => (r.category || 'clinic') === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${isActive ? f.activeColor : 'border-stone-200 bg-white text-stone-400'
                      }`}
                  >
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/60' : 'bg-stone-100'
                      }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Facility List — rendered first so it always shows even if map has issues */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showMap ? 0.1 : 0.3 }}>
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">
            {searchedLocationName
              ? `Facilities Near ${searchedLocationName.split(',')[0]}`
              : 'Mental Health Professionals Near You'
            }
            {filteredResources.length > 0 && (
              <span className="font-normal text-stone-300 ml-2">({filteredResources.length})</span>
            )}
          </h2>
          {filteredResources.length > 0 ? (
            <div className="space-y-3">
              {filteredResources.map((r, i) => {
                const filterCfg = FILTER_CONFIG.find(f => f.key === (r.category || 'clinic'));
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer
                    ${selectedIndex === i
                        ? 'border-teal-300 ring-2 ring-teal-100 bg-teal-50/30'
                        : 'border-stone-100 hover:border-teal-100'
                      } group`}
                    onClick={() => handleResourceClick(r, i)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full transition-colors ${selectedIndex === i
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-stone-100 text-stone-500 group-hover:bg-teal-50 group-hover:text-teal-600'
                        }`}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-800">{r.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${filterCfg?.color || 'bg-stone-50 text-stone-600'}`}>
                            {filterCfg ? `${filterCfg.emoji} ${filterCfg.label}` : r.type}
                          </span>
                          {r.distance && (
                            <span className="text-xs text-stone-400">{r.distance} km</span>
                          )}
                        </div>
                        {r.address && r.address !== 'Address not available' && (
                          <p className="text-sm text-stone-500 mt-1">{r.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Favourite toggle */}
                      <button
                        onClick={(e) => toggleFavorite(r, e)}
                        className={`p-2 rounded-xl border transition-all ${favorites.has(resourceKey(r))
                          ? 'bg-amber-50 border-amber-300 text-amber-400'
                          : 'bg-stone-50 border-stone-200 text-stone-300 hover:text-amber-400 hover:border-amber-200'
                          }`}
                        title={favorites.has(resourceKey(r)) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        <Star size={14} className={favorites.has(resourceKey(r)) ? 'fill-amber-400' : ''} />
                      </button>
                      {/* Directions */}
                      {r.latitude && r.longitude && (
                        <button
                          onClick={(e) => getDirections(r, e)}
                          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-teal-700 px-3 py-2 bg-stone-50 hover:bg-teal-50 rounded-xl border border-stone-200 hover:border-teal-200 transition-all"
                          title="Get directions"
                        >
                          <Compass size={14} />
                          <span className="hidden sm:inline">Directions</span>
                        </button>
                      )}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-teal-700 px-3 py-2 bg-stone-50 hover:bg-teal-50 rounded-xl border border-stone-200 hover:border-teal-200 transition-all"
                          title="Visit website"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                          <span className="hidden sm:inline">Website</span>
                        </a>
                      )}
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
                          title={`Call ${r.phone}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={14} />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !showMap ? (
            <p className="text-stone-500 text-sm mb-4">Click above to find support near your location.</p>
          ) : loadingNearby ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-stone-500 text-sm">Searching nearby facilities...</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <p className="text-amber-700 text-sm">No facilities found nearby. Try increasing the search radius or checking your connection.</p>
            </div>
          )}
        </motion.section>

        {/* Mental Health Initiatives — always shown once facilities are loaded */}
        {nearbyResources.length > 0 && (initiatives.immediate.length > 0 || initiatives.support.length > 0) && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 p-1.5 rounded-lg">
                <Lightbulb size={14} />
              </div>
              <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Mental Health Initiatives</h2>
            </div>
            <p className="text-xs text-stone-400 mb-3 px-2">Reach out to these organisations for mental health advocacy, crisis support, and professional guidance.</p>
            <div className="space-y-3">
              {[...initiatives.immediate, ...initiatives.support].map((init, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-violet-200 transition-all group relative overflow-hidden"
                >
                  {/* Subtle gradient accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-l-2xl" />
                  <div className="flex items-start justify-between gap-3 pl-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-stone-800 text-sm">{init.name}</h3>
                      <p className="text-xs text-stone-500 mt-1">{init.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={11} className="text-stone-400" />
                        <span className="text-[11px] text-stone-400 font-medium">{init.available}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {init.latitude && init.longitude && (
                        <button
                          onClick={(e) => getDirections({ name: init.name, latitude: init.latitude, longitude: init.longitude, type: 'initiative' }, e)}
                          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-100 hover:border-violet-200 transition-all"
                          title="Get directions"
                        >
                          <Compass size={14} />
                          <span className="hidden sm:inline">Directions</span>
                        </button>
                      )}
                      {init.website && (
                        <a
                          href={init.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-violet-700 px-3 py-2 bg-stone-50 hover:bg-violet-50 rounded-xl border border-stone-200 hover:border-violet-200 transition-all"
                          title="Visit website"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                          <span className="hidden sm:inline">Website</span>
                        </a>
                      )}
                      <a
                        href={`tel:${init.phone}`}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all shrink-0"
                        title={`Call ${init.phone}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Interactive Map — wrapped in error boundary */}
        {showMap && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
              <MapPin size={14} />
              Nearby Facilities Map
            </h2>
            <MapErrorBoundary>
              <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-lg" style={{ height: '420px' }}>
                <MapContainer
                  center={userLocation}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* User location marker */}
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                        <strong style={{ color: '#0d9488' }}>📍 You are here</strong>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Facility markers */}
                  {nearbyResources.map((r, i) => {
                    if (!r.latitude || !r.longitude) return null;
                    return (
                      <Marker
                        key={i}
                        position={[r.latitude, r.longitude]}
                        icon={createFacilityIcon(r.type)}
                        ref={(ref) => { markerRefs.current[i] = ref; }}
                      >
                        <Popup>
                          <div style={{ minWidth: '180px', padding: '4px' }}>
                            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{r.name}</strong>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: r.type === 'hospital' ? '#fef2f2' : '#f0fdfa',
                              color: r.type === 'hospital' ? '#dc2626' : '#0d9488',
                              marginBottom: '6px',
                            }}>
                              {r.type === 'hospital' ? '🏥 Hospital' : '🧠 Professional'}
                            </span>
                            {r.address && <p style={{ fontSize: '12px', color: '#78716c', margin: '4px 0' }}>{r.address}</p>}
                            {r.distance && <p style={{ fontSize: '11px', color: '#a8a29e', margin: '2px 0' }}>📏 {r.distance} km away</p>}
                            {r.phone && (
                              <a href={`tel:${r.phone}`} style={{ fontSize: '12px', color: '#0d9488', textDecoration: 'none', display: 'block', marginTop: '4px' }}>
                                📞 {r.phone}
                              </a>
                            )}
                            {r.website && (
                              <a href={r.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#0d9488', textDecoration: 'none', display: 'block', marginTop: '2px' }}>
                                🌐 Website
                              </a>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  <FitBounds positions={allPositions} />
                  <FlyToPoint position={flyTarget} trigger={flyTrigger} />
                </MapContainer>
              </div>
            </MapErrorBoundary>
            <p className="text-xs text-stone-400 mt-2 text-center">
              Map data © OpenStreetMap contributors
            </p>
          </motion.section>
        )}

        {/* Return to Chat */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-2 pb-8">
          <Button variant="secondary" className="w-full justify-center py-4 text-base" onClick={onReturnToChat}>
            Return to Chat
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
