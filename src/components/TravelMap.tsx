import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Search, Loader2, X, MapPin, Sparkles } from 'lucide-react';
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

interface TravelMapProps {
  locations: TravelLocation[];
  selectedLocation: TravelLocation | null;
  onSelectLocation: (location: TravelLocation) => void;
  onMapClick: (lat: number, lng: number) => void;
  isDarkMode: boolean;
  userLat?: number;
  userLng?: number;
  mapPanTrigger?: { lat: number; lng: number; timestamp: number } | null;
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

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
      
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-md px-2.5 py-1.4 rounded-md text-[9px] text-slate-500 dark:text-slate-400 z-[1000] border border-slate-100 dark:border-slate-800 pointer-events-none select-none transition-colors duration-300">
        💡 Click bản đồ để ghim tọa độ mới!
      </div>
    </div>
  );
};

export default TravelMap;
