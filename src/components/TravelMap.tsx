import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Search, Loader2, X, Navigation, Clock, Minus, ChevronUp, Layers, LocateFixed, Expand, Check } from 'lucide-react';
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

// Names can come from shared links or external APIs — never inject them as raw HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const [layersOpen, setLayersOpen] = useState(false);

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
    // Any map interaction closes the layer picker
    map.on('movestart click', () => setLayersOpen(false));

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

  // Recentre only when a *different* place gets selected — editing notes or
  // ticking "Đã đi" on the current one must not make the map jump.
  const selectedId = selectedLocation?.id;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    map.setView([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 9), {
      animate: true,
      duration: 1.2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
          <div class="group relative flex items-center justify-center ${scale} transition-all duration-300">
            ${isSelected ? `<span class="absolute inline-flex h-10 w-10 rounded-full bg-indigo-500/20 animate-pulse"></span>` : ''}
            <div class="h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-colors duration-300" style="background-color: ${color}; box-shadow: 0 0 10px ${ringColor}">
              <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>
            <div class="absolute -bottom-7 bg-slate-900/85 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} whitespace-nowrap pointer-events-none transition-opacity duration-200">
              ${escapeHtml(loc.name.split(',')[0])}
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

  // Update user live location marker (moved in place so the pulse doesn't restart on every GPS tick)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLat === undefined || userLng === undefined) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLng]);
      return;
    }

    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-12 w-12 rounded-full bg-blue-500/30 animate-ping"></span>
          <div class="h-5 w-5 rounded-full bg-blue-600 border-[3px] border-white shadow-lg ring-4 ring-blue-500/20"></div>
          <div class="absolute -top-7 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow whitespace-nowrap">
            Bạn ở đây
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 900 }).addTo(map);
  }, [userLat, userLng]);

  // Map helpers for the floating buttons
  const handleLocateMe = () => {
    if (!mapRef.current || userLat === undefined || userLng === undefined) return;
    mapRef.current.setView([userLat, userLng], Math.max(mapRef.current.getZoom(), 14), { animate: true });
  };

  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    if (locations.length === 0) {
      map.setView([15.9030623, 105.8066925], 5.5, { animate: true });
    } else if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 12, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(locations.map((l) => [l.lat, l.lng] as [number, number])), {
        padding: [48, 48],
        maxZoom: 13,
        animate: true,
      });
    }
  };

  const MAP_TYPES: { key: 'roadmap' | 'hybrid' | 'dark'; label: string; swatch: string }[] = [
    { key: 'roadmap', label: 'Bản đồ', swatch: 'bg-linear-to-br from-emerald-200 via-sky-100 to-amber-100' },
    { key: 'hybrid', label: 'Vệ tinh', swatch: 'bg-linear-to-br from-emerald-800 via-green-700 to-sky-800' },
    { key: 'dark', label: 'Tối', swatch: 'bg-linear-to-br from-slate-700 via-slate-800 to-slate-950' },
  ];

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

  const floatingButton =
    'w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-white text-slate-700 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.3)] hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition';
  const navSheetOpen = !!navTarget && !navCollapsed;

  return (
    // `isolate` keeps Leaflet's high z-indexes inside the map so they never cover the sticky header
    <div className="relative isolate w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer switcher (below Leaflet's zoom buttons) */}
      <div className="absolute top-[88px] left-[10px] z-[1000]">
        <button
          onClick={() => setLayersOpen((o) => !o)}
          className={floatingButton}
          title="Đổi kiểu bản đồ"
          aria-label="Đổi kiểu bản đồ"
          aria-expanded={layersOpen}
        >
          <Layers className="w-4 h-4" />
        </button>
        {layersOpen && (
          <div className="absolute left-[42px] top-0 p-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 flex gap-1.5 animate-fade-in">
            {MAP_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setMapType(t.key);
                  setLayersOpen(false);
                }}
                className={`relative w-16 rounded-xl p-1 text-[11px] font-semibold transition ${
                  mapType === t.key
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`block h-10 rounded-lg ${t.swatch} ring-1 ring-black/5`} />
                <span className="block mt-1">{t.label}</span>
                {mapType === t.key && (
                  <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate me / fit all (bottom-right, thumb friendly) */}
      {!navSheetOpen && (
        <div className="absolute right-[10px] bottom-8 z-[1000] flex flex-col gap-2">
          <button
            onClick={handleFitAll}
            className={floatingButton}
            title="Xem tất cả địa điểm"
            aria-label="Xem tất cả địa điểm"
          >
            <Expand className="w-4 h-4" />
          </button>
          <button
            onClick={handleLocateMe}
            disabled={userLat === undefined}
            className={`${floatingButton} text-blue-600 dark:text-blue-400`}
            title={userLat === undefined ? 'Chưa có tín hiệu GPS' : 'Về vị trí của tôi'}
            aria-label="Về vị trí của tôi"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Address Search Bar Overlay */}
      <div ref={searchContainerRef} className="absolute top-[10px] right-[10px] z-[1000] w-[min(18rem,calc(100%-4.5rem))] sm:w-72 md:w-80">
        <form onSubmit={handleOnlineSearch} className="relative flex items-center rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.3)] ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
          <div className="absolute left-3 text-slate-400">
            {searchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <input
            type="text"
            placeholder="Tìm địa danh (Huế, Đà Lạt…)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full h-[34px] pl-9 pr-16 text-base sm:text-[13px] bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400"
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
              className="absolute right-[50px] w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!searchQuery.trim() || searchLoading}
            className="absolute right-1 h-[26px] px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition"
          >
            Tìm
          </button>
        </form>

        {/* Suggestion Dropdown List */}
        <AnimatePresence>
          {showSuggestions && (searchQuery.trim().length > 0) && (localFiltered.length > 0 || searchResults.length > 0 || searchLoading) && (
            <div className="absolute top-[42px] left-0 right-0 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 rounded-2xl shadow-xl z-[1001] divide-y divide-slate-100 dark:divide-slate-800/60 select-none">

              {/* Local Matches in current itinerary */}
              {localFiltered.length > 0 && (
                <div className="p-1.5">
                  <span className="px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                    Trong danh sách của bạn ({localFiltered.length})
                  </span>
                  <div className="space-y-0.5">
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
                        className="w-full text-left px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[13px] font-medium transition flex items-center justify-between gap-2 group"
                      >
                        <span className="text-slate-800 dark:text-slate-200 truncate">
                          📌 {loc.name}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:underline">
                          Xem
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Online OSM/Nominatim Results */}
              {(searchResults.length > 0 || searchLoading) && (
                <div className="p-1.5">
                  <span className="px-2 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 block">
                    Kết quả trên bản đồ (OpenStreetMap)
                  </span>
                  {searchLoading ? (
                    <div className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                      Đang tìm kiếm…
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
                                popupContent.className = 'p-0.5 text-xs text-slate-800 space-y-2';
                                const title = document.createElement('div');
                                title.className = 'font-bold text-[13px] leading-snug text-slate-900';
                                title.textContent = simplified; // textContent: place names come from an external API
                                popupContent.appendChild(title);
                                popupContent.insertAdjacentHTML(
                                  'beforeend',
                                  `<div class="text-[11px] text-slate-500 leading-normal">Thêm địa danh này vào danh sách của bạn?</div>
                                  <button class="add-preset-btn w-full h-8 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                                    ＋ Thêm địa điểm
                                  </button>`
                                );

                                popupContent.querySelector('.add-preset-btn')?.addEventListener('click', () => {
                                  onMapClick(lat, lng);
                                  marker.closePopup();
                                });

                                marker.bindPopup(popupContent, { minWidth: 150 }).openPopup();
                                tempMarkerRef.current = marker;
                              }
                              
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                          >
                            <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
                              🔍 {simplified}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
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
                <div className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nhấn <b>Tìm</b> để tra cứu địa danh trên bản đồ.
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Compact legend */}
      {!navTarget && (
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-[0_4px_14px_-4px_rgba(15,23,42,0.3)] text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-500/20" />
            Chưa đi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            Đã đi
          </span>
          {userLat !== undefined && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-500/20" />
              Bạn
            </span>
          )}
        </div>
      )}

      {/* Collapsed navigation pill — keeps the map fully visible */}
      {navTarget && navCollapsed && (
        <div className="absolute bottom-3 left-3 z-[1002] flex items-center gap-1 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-2xl ring-1 ring-white/20 pl-1 pr-1 py-1">
          <button
            onClick={() => setNavCollapsed(false)}
            className="flex items-center gap-2 pl-2 pr-1 py-1"
            title="Mở lại bảng chỉ đường"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold whitespace-nowrap tabular-nums">
              {routeInfo
                ? `${formatDistance(routeInfo.distance)} · ${formatDuration(routeInfo.duration)}`
                : 'Chỉ đường'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            onClick={() => onStopNavigation?.()}
            className="w-7 h-7 rounded-full hover:bg-white/25 flex items-center justify-center transition shrink-0"
            title="Kết thúc chỉ đường"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Realtime navigation bottom sheet (Google-Maps style directions) */}
      {navTarget && !navCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 z-[1002] p-2.5 sm:p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden">
            {/* Header: destination + live summary */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white">
              <span className="shrink-0 w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate leading-tight">
                  Chỉ đường tới {navTarget.name.split(',')[0]}
                </div>
                <div className="text-xs opacity-90 leading-tight mt-1">
                  {routeInfo ? (
                    <span className="inline-flex items-center gap-2.5 font-semibold tabular-nums">
                      <span>🚗 {formatDistance(routeInfo.distance)}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {formatDuration(routeInfo.duration)}
                      </span>
                    </span>
                  ) : routeLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang tính tuyến đường…
                    </span>
                  ) : routeError ? (
                    <span>Chưa có tuyến đường</span>
                  ) : (
                    <span>Đang chuẩn bị chỉ đường…</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setNavCollapsed(true)}
                className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition"
                title="Thu gọn bảng (chỉ xem bản đồ)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onStopNavigation?.()}
                className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition"
                title="Kết thúc chỉ đường"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Turn-by-turn steps */}
            {routeError ? (
              <div className="px-3.5 py-3 text-[13px] text-rose-600 dark:text-rose-400 font-medium">
                {routeError}
              </div>
            ) : routeInfo && routeInfo.steps.length > 0 ? (
              <div className="max-h-36 sm:max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {routeInfo.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3.5 py-2">
                    <span className="shrink-0 text-base leading-none">{stepEmoji(step)}</span>
                    <span className="flex-1 text-[13px] text-slate-700 dark:text-slate-200 truncate font-medium">
                      {translateStep(step)}
                    </span>
                    {step.distance > 0 && (
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                        {formatDistance(step.distance)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3.5 py-3 text-[13px] text-slate-400 dark:text-slate-500">
                {routeLoading ? 'Đang tải hướng dẫn từng chặng…' : 'Chưa có dữ liệu chỉ đường.'}
              </div>
            )}

            {/* Google Maps full navigation fallback */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 h-11 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 text-[13px] font-semibold border-t border-slate-100 dark:border-slate-800 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              Mở điều hướng Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelMap;
