import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Search, Loader2, X, MapPin, Sparkles, Navigation, Clock, Minus, ChevronUp } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { TravelLocation } from '../types';

// Accent reduction helper for Vietnamese search
function removeTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|U|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Haversine distance in meters between two coordinates
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Human friendly distance/duration formatting (Vietnamese)
function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 1) return 'dưới 1 phút';
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

const MODIFIER_VI: Record<string, string> = {
  left: 'trái',
  right: 'phải',
  'slight left': 'chếch trái',
  'slight right': 'chếch phải',
  'sharp left': 'gắt sang trái',
  'sharp right': 'gắt sang phải',
  straight: 'thẳng',
  uturn: 'quay đầu xe',
};

// Build a short Vietnamese turn-by-turn instruction from an OSRM step
function translateStep(step: any): string {
  const type = step?.maneuver?.type;
  const mod = step?.maneuver?.modifier;
  const road = step?.name ? ` vào ${step.name}` : '';
  switch (type) {
    case 'depart':
      return `Xuất phát${road}`;
    case 'arrive':
      return 'Đã đến nơi 🎉';
    case 'turn':
      return `Rẽ ${MODIFIER_VI[mod] || ''}`.trim() + road;
    case 'continue':
      return `Đi tiếp${road}`;
    case 'merge':
      return `Nhập làn${road}`;
    case 'on ramp':
      return `Vào đường nhánh${road}`;
    case 'off ramp':
      return `Ra khỏi đường nhánh${road}`;
    case 'fork':
      return `Tại ngã rẽ đi ${MODIFIER_VI[mod] || 'thẳng'}${road}`;
    case 'end of road':
      return `Cuối đường, rẽ ${MODIFIER_VI[mod] || ''}`.trim() + road;
    case 'roundabout':
    case 'rotary':
      return `Đi vào vòng xuyến${road}`;
    case 'new name':
      return `Tiếp tục${road}`;
    default:
      return `Tiếp tục${road}`;
  }
}

function stepEmoji(step: any): string {
  const type = step?.maneuver?.type;
  const mod: string = step?.maneuver?.modifier || '';
  if (type === 'depart') return '📍';
  if (type === 'arrive') return '🏁';
  if (type === 'roundabout' || type === 'rotary') return '🔄';
  if (mod === 'uturn') return '↩️';
  if (mod.includes('left')) return '⬅️';
  if (mod.includes('right')) return '➡️';
  return '⬆️';
}

interface RouteInfo {
  distance: number;
  duration: number;
  steps: any[];
}

interface TravelMapProps {
  locations: TravelLocation[];
  selectedLocation: TravelLocation | null;
  onSelectLocation: (location: TravelLocation) => void;
  onMapClick: (lat: number, lng: number) => void;
  isDarkMode: boolean;
  userLat?: number;
  userLng?: number;
  mapPanTrigger?: { lat: number; lng: number; timestamp: number } | null;
  navTarget?: TravelLocation | null;
  onStopNavigation?: () => void;
}

export const TravelMap: React.FC<TravelMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onMapClick,
  isDarkMode,
  userLat,
  userLng,
  mapPanTrigger,
  navTarget,
  onStopNavigation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Realtime navigation / routing refs & state
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const navMarkerRef = useRef<L.Marker | null>(null);
  const lastRoutedRef = useRef<{ lat: number; lng: number } | null>(null);
  const activeNavIdRef = useRef<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Always re-open the panel when navigation starts on a new target
  useEffect(() => {
    setNavCollapsed(false);
  }, [navTarget?.id]);

  // Set default map type: roadmap, hybrid satellite, or dark mode
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid' | 'dark'>(isDarkMode ? 'dark' : 'roadmap');

  // Search states for local and online Nominatim inquiries
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Compute local accent-insensitive occurrences
  const localFiltered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryClean = removeTones(searchQuery).toLowerCase();
    return locations.filter(loc => {
      const nameClean = removeTones(loc.name).toLowerCase();
      const notesClean = removeTones(loc.notes || '').toLowerCase();
      return nameClean.includes(queryClean) || notesClean.includes(queryClean);
    });
  }, [searchQuery, locations]);

  // Handle Online Address Lookup
  const handleOnlineSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchLoading(true);
    setShowSuggestions(true);

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1&accept-language=vi`,
        {
          headers: {
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'User-Agent': 'CamOnNhe/1.0 (trungdeveloper1993@gmail.com)'
          }
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        setSearchResults(data || []);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm Nominitam trực tuyến:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use Vietnam center as initial view if empty, or selected location
    const initialLat = selectedLocation ? selectedLocation.lat : 15.9030623;
    const initialLng = selectedLocation ? selectedLocation.lng : 105.8066925;
    const initialZoom = selectedLocation ? 9 : 5.5;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      minZoom: 2,
    }).setView([initialLat, initialLng], initialZoom);

    mapRef.current = map;

    // Set map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Fire invalidate size several times initially to guarantee total load coverage
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    const timer3 = setTimeout(() => map.invalidateSize(), 1200);

    // Watch resize of container explicitly to invalidate size and load tiles fully
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync dark mode state to map type representation
  useEffect(() => {
    setMapType(isDarkMode ? 'dark' : 'roadmap');
  }, [isDarkMode]);

  // Handle active selected location panning (from list details trigger)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    map.setView([selectedLocation.lat, selectedLocation.lng], 9, {
      animate: true,
      duration: 1.2,
    });
  }, [selectedLocation]);

  // Handle explicit pan trigger (forces re-centering when card locate buttons are clicked again)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapPanTrigger) return;

    map.setView([mapPanTrigger.lat, mapPanTrigger.lng], 12, {
      animate: true,
      duration: 1.5,
    });
  }, [mapPanTrigger]);

  // Invalidate map layout size to keep render crisp and ensure zero empty sections
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [locations, mapType]);

  // React to mapType / layer updates by mounting specific tile servers
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = '';
    let attribution = '';

    if (mapType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } else if (mapType === 'hybrid') {
      // High resolution, lag-free Google hybrid satellite map with clear labels
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps';
    } else {
      // High resolution, lag-free Google standard roadmap (very fast and clear!)
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps';
    }

    const tiles = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    });

    tiles.addTo(mapRef.current);
    tileLayerRef.current = tiles;
  }, [mapType]);

  // Update Markers when locations or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    (Object.values(markersRef.current) as L.Marker[]).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Standard fallback resolution
    locations.forEach((loc) => {
      const color = loc.visited ? '#10B981' : '#F97316'; // Emerald vs Orange
      const ringColor = loc.visited ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)';
      const isSelected = selectedLocation?.id === loc.id;
      const scale = isSelected ? 'scale-125' : 'scale-100';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center ${scale} transition-all duration-300">
            ${isSelected ? `<span class="absolute inline-flex h-10 w-10 rounded-full bg-indigo-500/20 animate-pulse"></span>` : ''}
            <div class="h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-colors duration-300" style="background-color: ${color}; box-shadow: 0 0 10px ${ringColor}">
              <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>
            <div class="absolute -bottom-8 bg-slate-900/90 text-white dark:bg-white dark:text-slate-900 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shadow-sm opacity-0 hover:opacity-100 md:opacity-40 whitespace-nowrap border dark:border-slate-300 pointer-events-none transition-all duration-200">
              ${loc.name.split(',')[0]}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
      
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(loc);
      });

      marker.addTo(map);
      markersRef.current[loc.id] = marker;
    });
  }, [locations, selectedLocation]);

  // Update user live/simulated location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLat !== undefined && userLng !== undefined) {
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-12 w-12 rounded-full bg-blue-500/40 animate-ping"></span>
            <div class="h-6 w-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center ring-4 ring-blue-500/20">
              <span class="relative h-2 w-2 rounded-full bg-white"></span>
            </div>
            <div class="absolute -top-7 bg-blue-600 text-white text-[9px] font-semibold px-1 rounded shadow whitespace-nowrap">
              Vị trí của bạn
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const iconMarker = L.marker([userLat, userLng], { icon: userIcon });
      iconMarker.addTo(map);
      userMarkerRef.current = iconMarker;
    }
  }, [userLat, userLng]);

  // Realtime turn-by-turn routing: draw the road route from the live GPS
  // position to the navigation target and refresh it as the user moves.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clearRoute = () => {
      routeLayerRef.current?.remove();
      routeCasingRef.current?.remove();
      navMarkerRef.current?.remove();
      routeLayerRef.current = null;
      routeCasingRef.current = null;
      navMarkerRef.current = null;
    };

    // Navigation turned off → wipe everything
    if (!navTarget) {
      clearRoute();
      lastRoutedRef.current = null;
      activeNavIdRef.current = null;
      setRouteInfo(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    const isNewTarget = activeNavIdRef.current !== navTarget.id;

    // Drop a destination flag once per target
    if (isNewTarget) {
      navMarkerRef.current?.remove();
      const destIcon = L.divIcon({
        className: 'nav-dest-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-9 w-9 rounded-full bg-indigo-500/30 animate-ping"></span>
            <div class="h-7 w-7 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-sm">🏁</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      navMarkerRef.current = L.marker([navTarget.lat, navTarget.lng], {
        icon: destIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      activeNavIdRef.current = navTarget.id;
      lastRoutedRef.current = null;
      setRouteInfo(null);
      setRouteError(null);
    }

    // Need a live GPS fix to compute the route
    if (userLat === undefined || userLng === undefined) {
      setRouteError('Đang chờ tín hiệu GPS — hãy bật định vị để xem chỉ đường.');
      return;
    }

    // Throttle: skip re-routing for tiny movements (< 25m)
    const moved = lastRoutedRef.current
      ? distanceMeters(lastRoutedRef.current.lat, lastRoutedRef.current.lng, userLat, userLng)
      : Infinity;
    if (!isNewTarget && moved < 25 && routeLayerRef.current) return;

    const firstForTarget = lastRoutedRef.current === null;
    let cancelled = false;

    const fetchRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${navTarget.lng},${navTarget.lat}?overview=full&geometries=geojson&steps=true`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('routing failed');
        const data = await resp.json();
        if (cancelled) return;
        if (!data.routes || !data.routes.length) throw new Error('no route');

        const route = data.routes[0];
        const latlngs: [number, number][] = route.geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]]
        );

        // Redraw the route (casing underneath + colored line on top)
        routeLayerRef.current?.remove();
        routeCasingRef.current?.remove();
        routeCasingRef.current = L.polyline(latlngs, {
          color: '#ffffff',
          weight: 9,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
        routeLayerRef.current = L.polyline(latlngs, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        // Frame both endpoints only when navigation first starts
        if (firstForTarget) {
          map.fitBounds(routeLayerRef.current.getBounds(), {
            padding: [60, 60],
            maxZoom: 16,
          });
        }

        lastRoutedRef.current = { lat: userLat, lng: userLng };
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          steps: route.legs?.[0]?.steps || [],
        });
      } catch (e) {
        if (!cancelled) {
          setRouteError('Không lấy được tuyến đường lúc này. Bạn có thể mở Google Maps bên dưới.');
        }
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [navTarget, userLat, userLng]);

  // Build a Google Maps directions deep-link as a full turn-by-turn fallback
  const googleMapsUrl = navTarget
    ? `https://www.google.com/maps/dir/?api=1&${
        userLat !== undefined && userLng !== undefined ? `origin=${userLat},${userLng}&` : ''
      }destination=${navTarget.lat},${navTarget.lng}&travelmode=driving`
    : '#';

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 dark:border-slate-800/80 select-none">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] md:min-h-[450px]" />
      
      {/* Floating Map Style Selector Pill (Clean, Sleek and elegant overlay below zoom buttons) */}
      <div className="absolute top-[76px] left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md px-2 py-1.2 rounded-xl z-[1000] border border-slate-150 dark:border-slate-800 flex items-center gap-1 transition-colors duration-300">
        <button
          onClick={() => setMapType('roadmap')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight cursor-pointer transition-all ${
            mapType === 'roadmap'
              ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          Google Map
        </button>
        <button
          onClick={() => setMapType('hybrid')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight cursor-pointer transition-all ${
            mapType === 'hybrid'
              ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          Vệ tinh
        </button>
        <button
          onClick={() => setMapType('dark')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight cursor-pointer transition-all ${
            mapType === 'dark'
              ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          Bản đồ Tối
        </button>
      </div>

      {/* Floating Address Search Bar Overlay */}
      <div ref={searchContainerRef} className="absolute top-3 right-3 z-[1000] w-64 sm:w-72 md:w-80">
        <form onSubmit={handleOnlineSearch} className="relative flex items-center shadow-md rounded-xl overflow-hidden border border-slate-200 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur transition-all duration-300">
          <div className="absolute left-3 text-slate-400">
            {searchLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <input
            type="text"
            placeholder="Tìm địa danh du lịch (Huế, Đà Lạt...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-8.5 pr-14 py-2 text-[11px] bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSuggestions(false);
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.remove();
                  tempMarkerRef.current = null;
                }
              }}
              className="absolute right-10 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="submit"
            disabled={!searchQuery.trim() || searchLoading}
            className="absolute right-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-lg text-[9px] font-bold transition cursor-pointer"
          >
            Tìm
          </button>
        </form>

        {/* Suggestion Dropdown List */}
        <AnimatePresence>
          {showSuggestions && (searchQuery.trim().length > 0) && (localFiltered.length > 0 || searchResults.length > 0 || searchLoading) && (
            <div className="absolute top-9.5 left-0 right-0 max-h-56 overflow-y-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl backdrop-blur-md z-[1001] divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar select-none">
              
              {/* Local Matches in current itinerary */}
              {localFiltered.length > 0 && (
                <div className="p-1.5">
                  <span className="px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold text-indigo-500 dark:text-indigo-400 block">
                    Trong lịch trình của bạn ({localFiltered.length})
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {localFiltered.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          mapRef.current?.setView([loc.lat, loc.lng], 12, { animate: true });
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold transition flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                          📌 {loc.name}
                        </span>
                        <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-mono shrink-0 group-hover:underline">
                          Bay tới
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Online OSM/Nominatim Results */}
              {(searchResults.length > 0 || searchLoading) && (
                <div className="p-1.5">
                  <span className="px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold text-violet-500 dark:text-violet-400 block">
                    Kết quả trực tuyến (OpenStreetMap)
                  </span>
                  {searchLoading ? (
                    <div className="px-3 py-2 text-[9px] text-slate-400 dark:text-slate-500 animate-pulse flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                      Đang tìm kiếm trên bản đồ Việt Nam...
                    </div>
                  ) : (
                    <div className="space-y-0.5 mt-1">
                      {searchResults.map((place, idx) => {
                        const displayName = place.display_name;
                        const simplified = displayName.split(',').slice(0, 3).join(', ').trim();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const lat = parseFloat(place.lat);
                              const lng = parseFloat(place.lon);
                              
                              if (mapRef.current) {
                                mapRef.current.setView([lat, lng], 13, { animate: true });
                                
                                // Reset old temporary search marker
                                if (tempMarkerRef.current) {
                                  tempMarkerRef.current.remove();
                                }

                                const searchIcon = L.divIcon({
                                  className: 'search-temp-icon',
                                  html: `
                                    <div class="relative flex items-center justify-center scale-110">
                                      <span class="absolute inline-flex h-8 w-8 rounded-full bg-indigo-500/30 animate-pulse"></span>
                                      <div class="h-6 w-6 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center">
                                        <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                                      </div>
                                    </div>
                                  `,
                                  iconSize: [24, 24],
                                  iconAnchor: [12, 12]
                                });

                                const marker = L.marker([lat, lng], { icon: searchIcon }).addTo(mapRef.current);
                                
                                const popupContent = document.createElement('div');
                                popupContent.className = 'p-1 text-xs text-slate-800 dark:text-slate-100 space-y-1.5';
                                popupContent.innerHTML = `
                                  <div class="font-extrabold leading-tight text-slate-900">${simplified}</div>
                                  <div class="text-[9px] text-slate-500 leading-normal">Bạn muốn thêm địa danh này vào lịch trình?</div>
                                  <button class="add-preset-btn w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] uppercase font-extrabold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1">
                                    ➕ Thêm Địa Điểm
                                  </button>
                                `;

                                popupContent.querySelector('.add-preset-btn')?.addEventListener('click', () => {
                                  onMapClick(lat, lng);
                                  marker.closePopup();
                                });

                                marker.bindPopup(popupContent, { minWidth: 150 }).openPopup();
                                tempMarkerRef.current = marker;
                              }
                              
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] transition cursor-pointer"
                          >
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              🔍 {simplified}
                            </div>
                            <div className="text-[8px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {displayName}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* No results prompt */}
              {!searchLoading && localFiltered.length === 0 && searchResults.length === 0 && (
                <div className="px-3 py-3 text-center text-[10px] text-slate-500 dark:text-slate-400">
                  Gõ từ khóa & nhấn <b>Tìm</b> để tra cứu địa danh trực tuyến hoặc lưu trữ nội bộ.
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Control Info Badges */}
      <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md px-3 py-1.5 rounded-lg text-[11px] font-medium z-[1000] border border-slate-100 dark:border-slate-850 pointer-events-none flex items-center space-x-3 transition-colors duration-300">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          <span className="text-slate-600 dark:text-slate-300">Định ghé thăm</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-slate-600 dark:text-slate-300">Đã hoàn thành</span>
        </div>
        {userLat !== undefined && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">GPS Hiện tại</span>
          </div>
        )}
      </div>
      
      {!navTarget && (
        <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-md px-2.5 py-1.4 rounded-md text-[9px] text-slate-500 dark:text-slate-400 z-[1000] border border-slate-100 dark:border-slate-800 pointer-events-none select-none transition-colors duration-300">
          💡 Click bản đồ để ghim tọa độ mới!
        </div>
      )}

      {/* Collapsed navigation pill — keeps the map fully visible */}
      {navTarget && navCollapsed && (
        <div className="absolute bottom-3 left-3 z-[1002] flex items-center gap-1 bg-indigo-600 text-white rounded-full shadow-2xl border border-white/20 pl-1 pr-1 py-1">
          <button
            onClick={() => setNavCollapsed(false)}
            className="flex items-center gap-2 pl-2 pr-1 py-0.5 cursor-pointer"
            title="Mở lại bảng chỉ đường"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold font-mono whitespace-nowrap">
              {routeInfo
                ? `${formatDistance(routeInfo.distance)} · ${formatDuration(routeInfo.duration)}`
                : 'Chỉ đường'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            onClick={() => onStopNavigation?.()}
            className="w-6 h-6 rounded-full hover:bg-white/25 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Kết thúc chỉ đường"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Realtime navigation bottom sheet (Google-Maps style directions) */}
      {navTarget && !navCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 z-[1002] p-2.5 sm:p-3">
          <div className="bg-white/97 dark:bg-slate-900/97 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header: destination + live summary */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-indigo-600 text-white">
              <span className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-extrabold truncate leading-tight">
                  Chỉ đường tới {navTarget.name.split(',')[0]}
                </div>
                <div className="text-[10px] opacity-90 leading-tight mt-0.5">
                  {routeInfo ? (
                    <span className="inline-flex items-center gap-2 font-mono font-bold">
                      <span>🚗 {formatDistance(routeInfo.distance)}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatDuration(routeInfo.duration)}
                      </span>
                    </span>
                  ) : routeLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang tính tuyến đường...
                    </span>
                  ) : (
                    <span>Đang chuẩn bị chỉ đường...</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setNavCollapsed(true)}
                className="shrink-0 w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                title="Thu gọn bảng (chỉ xem bản đồ)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onStopNavigation?.()}
                className="shrink-0 w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                title="Kết thúc chỉ đường"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Turn-by-turn steps */}
            {routeError ? (
              <div className="px-3 py-2.5 text-[10.5px] text-rose-500 dark:text-rose-400 font-medium">
                {routeError}
              </div>
            ) : routeInfo && routeInfo.steps.length > 0 ? (
              <div className="max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
                {routeInfo.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5">
                    <span className="shrink-0 text-sm leading-none">{stepEmoji(step)}</span>
                    <span className="flex-1 text-[10.5px] text-slate-700 dark:text-slate-200 truncate font-medium">
                      {translateStep(step)}
                    </span>
                    {step.distance > 0 && (
                      <span className="shrink-0 text-[9px] font-mono text-slate-400 dark:text-slate-500">
                        {formatDistance(step.distance)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                {routeLoading ? 'Đang tải hướng dẫn từng chặng...' : 'Chưa có dữ liệu chỉ đường.'}
              </div>
            )}

            {/* Google Maps full navigation fallback */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 transition cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              Mở điều hướng Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelMap;
