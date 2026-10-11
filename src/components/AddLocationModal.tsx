import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  MapPin,
  CalendarDays,
  Sparkles,
  Loader2,
  LocateFixed,
  MousePointerClick,
  Check,
  CircleCheck,
  AlertTriangle,
} from 'lucide-react';
import { TravelLocation } from '../types';
import { BEAUTIFUL_PRESETS, FAMOUS_DESTINATIONS, SuggestedSpot } from '../data/defaultLocations';
import { REGIONS } from '../lib/utils';
import SmartImage from './SmartImage';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Omit<TravelLocation, 'id' | 'createdAt'>) => void;
  initialLat?: number;
  initialLng?: number;
  isDarkMode: boolean;
  /** GPS fix available → enables "pin my current location" */
  hasGps?: boolean;
  onUseMyLocation?: () => void;
  /** Close the dialog so the user can tap a spot on the map */
  onPickOnMap?: () => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLat,
  initialLng,
  hasGps = false,
  onUseMyLocation,
  onPickOnMap,
}) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Miền Bắc');
  const [image, setImage] = useState('');
  const [lat, setLat] = useState<number>(16.0);
  const [lng, setLng] = useState<number>(108.0);
  const [notes, setNotes] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [visited, setVisited] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<typeof FAMOUS_DESTINATIONS[0] | null>(null);
  const [realtimeSpots, setRealtimeSpots] = useState<SuggestedSpot[]>([]);
  const [isFetchingRealtime, setIsFetchingRealtime] = useState(false);
  const [hasRealtimeError, setHasRealtimeError] = useState(false);

  // Approximate centers & degree ranges for matching regions upon map click
  const CENTERS_RANGE = [
    { id: 'dalat', lat: 11.940, lng: 108.441, radius: 0.65 },      // Lâm Đồng / Đà Lạt
    { id: 'buonmathuot', lat: 12.696, lng: 108.053, radius: 0.85 }, // Đắk Lắk / BMT
    { id: 'danang', lat: 16.047, lng: 108.206, radius: 0.85 },     // Đà Nẵng / Hội An
    { id: 'hanoi', lat: 21.028, lng: 105.854, radius: 0.65 },      // Hà Nội
    { id: 'sapa', lat: 22.336, lng: 103.843, radius: 0.55 },       // Sa Pa
    { id: 'halong', lat: 20.950, lng: 107.050, radius: 0.65 },     // Hạ Long
    { id: 'phuquoc', lat: 10.150, lng: 103.960, radius: 0.45 },    // Phú Quốc
  ];

  const fetchRealtimeSpots = async (fixedLat: number, fixedLng: number, currentRegion: string) => {
    setIsFetchingRealtime(true);
    setHasRealtimeError(false);
    setRealtimeSpots([]);

    try {
      // Overpass API tourist attractions query (limit to points/nodes near the coordinates)
      // Radius: 25km
      const query = `[out:json][timeout:8];(node(around:25000,${fixedLat},${fixedLng})[tourism=attraction];node(around:25000,${fixedLat},${fixedLng})[tourism=viewpoint];node(around:25000,${fixedLat},${fixedLng})[tourism=museum];node(around:25000,${fixedLat},${fixedLng})[historic=memorial];node(around:25000,${fixedLat},${fixedLng})[historic=castle];node(around:25000,${fixedLat},${fixedLng})[amenity=place_of_worship];);out 12;`;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Overpass network responded with error');
      }
      const data = await response.json();
      
      if (data && data.elements && data.elements.length > 0) {
        const spots: SuggestedSpot[] = data.elements
          .filter((el: any) => el.tags && el.tags.name)
          .map((el: any, index: number) => {
            const name = el.tags.name;
            const spotLat = el.lat || (el.center ? el.center.lat : fixedLat);
            const spotLng = el.lon || (el.center ? el.center.lon : fixedLng);
            
            let desc = '';
            if (el.tags.description) {
              desc = el.tags.description;
            } else {
              const types: string[] = [];
              if (el.tags.tourism) types.push(el.tags.tourism);
              if (el.tags.historic) types.push(el.tags.historic);
              if (el.tags.amenity) types.push(el.tags.amenity);
              
              const formatType = (t: string) => {
                switch(t) {
                  case 'attraction': return 'Điểm du lịch thu hút';
                  case 'viewpoint': return 'Góc ngắm cảnh đẹp';
                  case 'museum': return 'Bảo tàng văn hóa / di sản';
                  case 'memorial': return 'Đài tưởng niệm / Di tích lịch sử';
                  case 'castle': return 'Biệt điện / Lâu đài cổ';
                  case 'place_of_worship': return 'Địa điểm thờ tự / Đền chùa';
                  default: return t;
                }
              };
              const mappedType = types.map(formatType).join(', ');
              desc = mappedType ? `${mappedType} lân cận tọa độ bản đồ.` : 'Điểm dừng chân thú vị trên bản đồ.';
            }

            const dynamicPresets = [
              'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'
            ];
            const chosenImage = dynamicPresets[index % dynamicPresets.length];

            return {
              name,
              region: currentRegion,
              image: chosenImage,
              lat: spotLat,
              lng: spotLng,
              notes: desc
            };
          });

        const seenNames = new Set<string>();
        const uniqueSpots: SuggestedSpot[] = [];
        for (const s of spots) {
          const lowerName = s.name.toLowerCase();
          if (!seenNames.has(lowerName)) {
            seenNames.add(lowerName);
            uniqueSpots.push(s);
          }
        }
        setRealtimeSpots(uniqueSpots.slice(0, 8)); // Display up to 8 unique nearby spots
      } else {
        setRealtimeSpots([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải gợi ý thời gian thực:', err);
      setHasRealtimeError(true);
    } finally {
      setIsFetchingRealtime(false);
    }
  };

  // Opened from the "+" button (no coordinates yet): clear suggestions left over from a previous pin
  useEffect(() => {
    if (isOpen && (initialLat === undefined || initialLng === undefined)) {
      setDetectedCity(null);
      setRealtimeSpots([]);
      setHasRealtimeError(false);
      setGeocodeError(null);
    }
  }, [isOpen, initialLat, initialLng]);

  // Sync clicked coordinates from map if any and perform reverse geocoding via OpenStreetMap/Nominatim API
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined && isOpen) {
      const fixedLat = Number(initialLat.toFixed(5));
      const fixedLng = Number(initialLng.toFixed(5));
      setLat(fixedLat);
      setLng(fixedLng);

      // Auto assign fallback template region based on latitude
      const currentRegion = fixedLat > 19 ? 'Miền Bắc' : (fixedLat > 14 ? 'Miền Trung' : 'Miền Nam');
      setRegion(currentRegion);

      // Proximity-based matching before geocoding returns
      let initialMatched: typeof FAMOUS_DESTINATIONS[0] | null = null;
      let minDistance = Infinity;
      for (const center of CENTERS_RANGE) {
        const dLat = fixedLat - center.lat;
        const dLng = fixedLng - center.lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distance < center.radius && distance < minDistance) {
          minDistance = distance;
          initialMatched = FAMOUS_DESTINATIONS.find(c => c.id === center.id) || null;
        }
      }
      setDetectedCity(initialMatched);

      // Trigger Overpass real-time spots query if click is outside of static destination ranges
      if (!initialMatched) {
        fetchRealtimeSpots(fixedLat, fixedLng, currentRegion);
      } else {
        setRealtimeSpots([]);
      }

      // Trigger automatic place geocoding
      setIsGeocoding(true);
      setGeocodeError(null);
      setName('Đang định vị địa chỉ...');

      const controller = new AbortController();
      const signal = controller.signal;

      const fetchAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${fixedLat}&lon=${fixedLng}&zoom=18&addressdetails=1&accept-language=vi`,
            {
              signal,
              headers: {
                'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
                'User-Agent': 'CamOnNhe/1.0 (trungdeveloper1993@gmail.com)'
              }
            }
          );
          if (!response.ok) {
            throw new Error('CORS or Network issue contacting Nominatim');
          }
          const data = await response.json();
          if (data && data.display_name) {
            let guessedName = '';
            if (data.address) {
              const addr = data.address;
              
              // 1. Point of Interest or Specific Building/Shop details
              const poi = addr.amenity || addr.shop || addr.tourism || addr.historic || addr.leisure || addr.office || addr.craft || addr.attraction || addr.building || addr.house_name;
              
              // 2. Exact street or road name (crucial for pinpointing streets accurately)
              const street = addr.road || addr.highway || addr.pedestrian || addr.cycleway || addr.path;
              const houseNo = addr.house_number;
              const streetAddress = houseNo ? `${houseNo} ${street || ''}`.trim() : street;

              // 3. Local area boundaries (Commune, Ward, Hamlet, Suburb)
              const localArea = addr.neighbourhood || addr.suburb || addr.quarter || addr.hamlet || addr.village;
              const commune = addr.town || addr.municipality;
              
              // 4. District and Province boundaries
              const district = addr.city_district || addr.district || addr.county;
              const province = addr.city || addr.state || addr.province || addr.region;

              // Assemble address components starting from the most specific down to the region
              const parts: string[] = [];
              if (poi) parts.push(poi);
              if (streetAddress) parts.push(streetAddress);
              if (localArea) parts.push(localArea);
              if (commune) parts.push(commune);
              if (district) parts.push(district);
              if (province) parts.push(province);

              // Filter out exact duplicates (case-insensitive) to prevent any label repetition
              const uniqueParts: string[] = [];
              parts.forEach(part => {
                const trimmed = part.trim();
                if (!trimmed) return;
                const isDuplicate = uniqueParts.some(existing => existing.toLowerCase() === trimmed.toLowerCase());
                if (!isDuplicate) {
                  uniqueParts.push(trimmed);
                }
              });

              if (uniqueParts.length > 0) {
                // Return up to 5 elements to build an informative, elegant and extremely accurate position description
                guessedName = uniqueParts.slice(0, 5).join(', ');
              }
            }

            if (!guessedName) {
              // Parse displays nicely as compact path
              const parts = data.display_name.split(',');
              const filteredParts = parts.filter((p: string) => !/^\d+$/.test(p.trim()) && p.trim() !== 'Việt Nam');
              guessedName = filteredParts.slice(0, 3).join(', ').trim();
            }

            setName(guessedName);

            // Automated intelligence: detect address keywords and auto switch suggestions tab
            const lowerGuessed = guessedName.toLowerCase();
            const lowerDisplayName = (data.display_name || '').toLowerCase();
            const matchedCity = FAMOUS_DESTINATIONS.find(city => {
              const nameLower = city.cityName.toLowerCase();
              if (lowerGuessed.includes(nameLower) || lowerDisplayName.includes(nameLower)) return true;
              
              if (city.id === 'dalat') {
                return lowerGuessed.includes('đà lạt') || lowerDisplayName.includes('đà lạt') || lowerGuessed.includes('lâm đồng') || lowerDisplayName.includes('lâm đồng');
              }
              if (city.id === 'buonmathuot') {
                return lowerGuessed.includes('buôn ma thuột') || lowerDisplayName.includes('buôn ma thuột') || lowerGuessed.includes('bmt') || lowerGuessed.includes('đắk lắk') || lowerDisplayName.includes('đắk lắk') || lowerGuessed.includes('dak lak') || lowerDisplayName.includes('dak lak');
              }
              if (city.id === 'danang') {
                return lowerGuessed.includes('đà nẵng') || lowerGuessed.includes('hội an') || lowerDisplayName.includes('đà nẵng') || lowerDisplayName.includes('hội an') || lowerGuessed.includes('quảng nam') || lowerDisplayName.includes('quảng nam');
              }
              if (city.id === 'halong') {
                return lowerGuessed.includes('hạ long') || lowerDisplayName.includes('hạ long') || lowerGuessed.includes('quảng ninh') || lowerDisplayName.includes('quảng ninh');
              }
              if (city.id === 'sapa') {
                return lowerGuessed.includes('sa pa') || lowerGuessed.includes('sapa') || lowerDisplayName.includes('sa pa') || lowerDisplayName.includes('sapa') || lowerGuessed.includes('lào cai') || lowerDisplayName.includes('lào cai');
              }
              if (city.id === 'phuquoc') {
                return lowerGuessed.includes('phú quốc') || lowerDisplayName.includes('phú quốc') || lowerGuessed.includes('kiên giang') || lowerDisplayName.includes('kiên giang');
              }
              if (city.id === 'hanoi') {
                return lowerGuessed.includes('hà nội') || lowerDisplayName.includes('hà nội');
              }
              return false;
            });
            if (matchedCity) {
              setDetectedCity(matchedCity);
              setRealtimeSpots([]);
            } else if (!initialMatched) {
              setDetectedCity(null);
            }
          } else {
            setName(`Địa danh ghim (${fixedLat}, ${fixedLng})`);
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Lỗi khi tải vị trí địa danh thực tế:', err);
            setGeocodeError('Không thể tự động tải địa chỉ, hãy nhập thủ công bên dưới.');
            setName(`Địa danh ghim (${fixedLat}, ${fixedLng})`);
          }
        } finally {
          setIsGeocoding(false);
        }
      };

      const timer = setTimeout(() => {
        fetchAddress();
      }, 300);

      return () => {
        controller.abort();
        clearTimeout(timer);
      };
    }
  }, [initialLat, initialLng, isOpen]);

  // Handle Preset selection
  const handleApplyPreset = (preset: typeof BEAUTIFUL_PRESETS[0]) => {
    setName(preset.name);
    setRegion(preset.region);
    setImage(preset.image);
    setLat(preset.lat);
    setLng(preset.lng);
    setNotes(preset.notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use default travel photo if empty
    const finalImage = image.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600';

    onSave({
      name,
      region,
      image: finalImage,
      lat,
      lng,
      visited,
      notes,
      plannedDate: plannedDate || undefined
    });

    // Reset Form
    setName('');
    setImage('');
    setNotes('');
    setPlannedDate('');
    setVisited(false);
    onClose();
  };

  // ESC closes the dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const inputClass =
    'w-full h-11 px-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-slate-800 transition';
  const labelClass = 'flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400';
  const hasCoords = initialLat !== undefined && initialLng !== undefined;

  const quickAdd = (spot: SuggestedSpot) => {
    onSave({
      name: spot.name,
      region: spot.region,
      image: spot.image,
      lat: spot.lat,
      lng: spot.lng,
      notes: spot.notes,
      visited: false,
    });
    onClose();
  };

  const renderSpot = (spot: SuggestedSpot, idx: number) => (
    <div
      key={`${spot.name}-${idx}`}
      className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800"
    >
      <SmartImage
        src={spot.image}
        alt={spot.name}
        seed={spot.name}
        className="w-14 h-14 rounded-xl object-cover shrink-0"
        emojiClassName="text-2xl"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate" title={spot.name}>
          {spot.name.split(',')[0]}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2" title={spot.notes}>
          {spot.notes}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={() => quickAdd(spot)}
          className="h-8 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          title="Ghim ngay lên bản đồ"
        >
          Ghim
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(spot)}
          className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          title="Điền vào biểu mẫu để chỉnh sửa trước khi lưu"
        >
          Sửa
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 print:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 text-slate-800 dark:text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h2 id="add-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Thêm địa điểm mới
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {hasCoords ? 'Đã lấy vị trí bạn chọn trên bản đồ' : 'Chọn vị trí, dùng gợi ý hoặc tự điền thông tin'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                aria-label="Đóng"
                id="close-add-location-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Where is it? (only when no point was picked on the map) */}
                {!hasCoords && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onUseMyLocation}
                      disabled={!hasGps || !onUseMyLocation}
                      className="flex items-center gap-3 p-3 rounded-2xl text-left bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none transition"
                      id="add-use-my-location"
                    >
                      <span className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <LocateFixed className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">Ghim vị trí hiện tại</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {hasGps ? 'Nơi bạn đang đứng (GPS)' : 'Cần bật định vị trên thiết bị'}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onPickOnMap}
                      disabled={!onPickOnMap}
                      className="flex items-center gap-3 p-3 rounded-2xl text-left bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      <span className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm">
                        <MousePointerClick className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">Chọn trên bản đồ</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">Chạm vào điểm bạn muốn ghim</span>
                      </span>
                    </button>
                  </div>
                )}

                {/* City quick picks */}
                {!hasCoords && (
                  <div>
                    <span className={labelClass}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý theo thành phố
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
                      {FAMOUS_DESTINATIONS.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => setDetectedCity(detectedCity?.id === city.id ? null : city)}
                          aria-pressed={detectedCity?.id === city.id}
                          className={`shrink-0 h-9 px-3.5 rounded-xl text-[13px] font-semibold ring-1 transition ${
                            detectedCity?.id === city.id
                              ? 'bg-indigo-600 text-white ring-indigo-600'
                              : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                          }`}
                        >
                          {city.cityName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Famous spots for the detected / chosen city */}
                {detectedCity && (
                  <section className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-500/5 ring-1 ring-indigo-100 dark:ring-indigo-500/15 p-3 animate-fade-in">
                    <p className="flex items-center gap-1.5 mb-2.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Địa danh nổi tiếng tại {detectedCity.cityName}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[232px] overflow-y-auto">
                      {detectedCity.spots.map(renderSpot)}
                    </div>
                  </section>
                )}

                {/* Nearby attractions around the tapped point */}
                {hasCoords && !detectedCity && (
                  <section className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/5 ring-1 ring-emerald-100 dark:ring-emerald-500/15 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Địa danh lân cận (25 km)
                      </p>
                      {isFetchingRealtime && (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang dò tìm…
                        </span>
                      )}
                    </div>
                    {isFetchingRealtime ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[0, 1].map((i) => (
                          <div key={i} className="h-[72px] rounded-2xl bg-white/70 dark:bg-slate-800/60 animate-pulse" />
                        ))}
                      </div>
                    ) : hasRealtimeError ? (
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Không tải được gợi ý lúc này — bạn cứ đặt tên bên dưới nhé.
                      </p>
                    ) : realtimeSpots.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Không có điểm tham quan nổi bật quanh đây. Bạn có thể tự đặt tên bên dưới.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[232px] overflow-y-auto">
                        {realtimeSpots.map(renderSpot)}
                      </div>
                    )}
                  </section>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="add-name" className={labelClass}>
                    <MapPin className="w-3.5 h-3.5" />
                    Tên địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-name"
                    type="text"
                    required
                    placeholder="VD: Đồi chè Cầu Đất, Đà Lạt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                  {isGeocoding && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang tìm địa chỉ của điểm này…
                    </span>
                  )}
                  {geocodeError && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {geocodeError}
                    </span>
                  )}
                  {!isGeocoding && !geocodeError && hasCoords && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CircleCheck className="w-3.5 h-3.5" />
                      Đã tự điền theo địa chỉ thực tế trên bản đồ
                    </span>
                  )}
                </div>

                {/* Region */}
                <div>
                  <span className={labelClass}>Khu vực</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegion(r)}
                        aria-pressed={region === r}
                        className={`h-10 rounded-xl text-[13px] font-semibold ring-1 transition ${
                          region === r
                            ? 'bg-indigo-600 text-white ring-indigo-600'
                            : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Planned date */}
                  <div>
                    <label htmlFor="add-date" className={labelClass}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      Ngày dự kiến đi
                    </label>
                    <input
                      id="add-date"
                      type="date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Visited */}
                  <div>
                    <span className={labelClass}>Trạng thái</span>
                    <button
                      type="button"
                      onClick={() => setVisited(!visited)}
                      aria-pressed={visited}
                      className={`w-full h-11 px-3.5 rounded-2xl flex items-center gap-2.5 text-sm font-semibold transition ${
                        visited
                          ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          visited ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 dark:ring-slate-600'
                        }`}
                      >
                        {visited && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      {visited ? 'Đã đi rồi' : 'Chưa đi'}
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="add-notes" className={labelClass}>
                    Ghi chú
                  </label>
                  <textarea
                    id="add-notes"
                    rows={3}
                    placeholder="Món ngon, góc check-in đẹp, lưu ý khi đi…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputClass} h-auto py-3 resize-none leading-relaxed`}
                  />
                </div>

                {/* Image */}
                <div>
                  <label htmlFor="add-image" className={labelClass}>
                    <ImageIcon className="w-3.5 h-3.5" />
                    Link ảnh minh họa
                  </label>
                  <input
                    id="add-image"
                    type="url"
                    placeholder="https://… (để trống sẽ dùng ảnh mặc định)"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Coordinates */}
                <div>
                  <span className={labelClass}>Tọa độ (vĩ độ, kinh độ)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      aria-label="Vĩ độ"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className={`${inputClass} font-mono`}
                    />
                    <input
                      type="number"
                      step="any"
                      required
                      aria-label="Kinh độ"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  {!hasCoords && (
                    <span className="block mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      Mẹo: chọn trên bản đồ hoặc dùng vị trí hiện tại để có tọa độ chính xác.
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-4 rounded-2xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isGeocoding}
                  className="h-11 px-5 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition"
                  id="save-new-location-button"
                >
                  Ghim địa điểm
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AddLocationModal;

