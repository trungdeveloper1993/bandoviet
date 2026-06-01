import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, MapPin, Calendar, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { TravelLocation } from '../types';
import { BEAUTIFUL_PRESETS, FAMOUS_DESTINATIONS, SuggestedSpot } from '../data/defaultLocations';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Omit<TravelLocation, 'id' | 'createdAt'>) => void;
  initialLat?: number;
  initialLng?: number;
  isDarkMode: boolean;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLat,
  initialLng,
  isDarkMode
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
                'User-Agent': 'HanhTrinhViet/1.0 (trungdeveloper1993@gmail.com)'
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with pixel noise pattern feel */}
                {/* Modal Container in retro pixel border style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_24px_50px_rgba(0,0,0,0.14)] flex flex-col max-h-[90vh] z-10 select-none text-slate-800 dark:text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-extrabold text-sm font-mono animate-bounce">★</span>
                <span className="text-sm uppercase tracking-tight font-black text-slate-900 dark:text-white">
                  THÊM ĐỊA DANH MỚI
                </span>
              </div>
              <button
                onClick={onClose}
                className="py-1 px-3 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[9px] font-bold cursor-pointer flex items-center gap-1.5"
                id="close-add-location-modal"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>ĐÓNG</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 py-4 flex-1 space-y-4">
              {/* Spot Suggestions based on Detected City/Province */}
              {detectedCity && (
                <div className="space-y-3 bg-indigo-50/20 dark:bg-slate-950 p-4 border border-indigo-100/60 dark:border-indigo-900/30 rounded-2xl animate-fadeIn">
                  {/* Spots Suggestion Header */}
                  <div className="flex items-center gap-1.5 pb-2 select-none border-b border-dashed border-slate-200 dark:border-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                      💡 GỢI Ý ĐỊA DANH NỔI TIẾNG TẠI KHU VỰC {detectedCity.cityName.toUpperCase()}:
                    </span>
                  </div>

                  {/* Suggestion Spots Scroll list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {detectedCity.spots.map((spot, idx) => (
                      <div
                        key={idx}
                        className="group relative border border-slate-100 dark:border-slate-800/60 p-2 flex items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl transition duration-200 gap-3"
                      >
                        <img
                          src={spot.image}
                          alt={spot.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover shrink-0 rounded-xl shadow-sm"
                        />
                        <div className="flex-1 min-w-0 pr-1 select-text">
                          <p className="text-[10px] font-bold text-slate-950 dark:text-white truncate uppercase">
                            {spot.name.split(',')[0]}
                          </p>
                          <p className="text-[8.5px] text-slate-500 dark:text-slate-405 truncate italic font-sans" title={spot.notes}>
                            {spot.notes}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="text-[7px] bg-indigo-50 border border-indigo-105 px-1 py-0.2 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400 font-bold uppercase shrink-0">
                              {spot.region}
                            </span>
                            <span className="text-[6.5px] text-slate-400 dark:text-slate-500 shrink-0">
                              ({spot.lat.toFixed(2)}°, {spot.lng.toFixed(2)}°)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 shrink-0">
                          {/* Choose button to prefill form */}
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(spot)}
                            className="px-2.5 py-1 bg-yellow-350 bg-yellow-300 hover:bg-yellow-400 border-none rounded-lg text-[9px] font-black uppercase text-slate-900 cursor-pointer shadow-sm active:scale-95 transition"
                            title="Nạp dữ liệu vào biểu mẫu đăng ký bên dưới"
                          >
                            CHỌN
                          </button>
                          {/* Quick add button directly saves to traveler checklist */}
                          <button
                            type="button"
                            onClick={() => {
                              onSave({
                                name: spot.name,
                                region: spot.region,
                                image: spot.image,
                                lat: spot.lat,
                                lng: spot.lng,
                                notes: spot.notes,
                                visited: false
                              });
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer shadow-sm active:scale-95 transition"
                            title="Ghim tức thì lên nhật trình bản đồ"
                          >
                            GHIM ⚡
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Nearby Spot Suggestions wrapper */}
              {!detectedCity && (
                <div className="space-y-3 bg-indigo-50/20 dark:bg-slate-950 p-4 border border-indigo-100/60 dark:border-indigo-900/30 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 font-mono">
                    <div className="flex items-center gap-1.5 select-none">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-900 dark:text-white font-sans">
                        💡 GỢI Ý ĐỊA DANH LÂN CẬN (QUÉT REALTIME VỆ TINH):
                      </span>
                    </div>
                    {isFetchingRealtime && (
                      <div className="flex items-center gap-1 text-[8px] text-indigo-600 dark:text-indigo-400 animate-pulse font-extrabold uppercase font-sans">
                        <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
                        Đang dò tìm...
                      </div>
                    )}
                  </div>

                  {isFetchingRealtime && (
                    <div className="py-6 text-center text-slate-500 dark:text-slate-400 font-sans text-[10px] uppercase tracking-wider animate-pulse font-medium">
                      ⌛ Đang kết nối máy chủ bản đồ để dò tìm danh thắng trong bán kính 25km...
                    </div>
                  )}

                  {!isFetchingRealtime && realtimeSpots.length === 0 && !hasRealtimeError && (
                    <div className="py-4 text-center text-slate-400 dark:text-slate-550 font-sans text-[11px] italic">
                      Không tìm thấy điểm tham quan nổi bật nào lân cận tọa độ này. Bạn có thể tự do nhập tên địa điểm thủ công bên dưới!
                    </div>
                  )}

                  {!isFetchingRealtime && hasRealtimeError && (
                    <div className="py-4 text-center text-rose-500 font-sans text-[10px] uppercase font-bold">
                      ⚠️ Gặp sự cố kết nối máy chủ gợi ý. Bạn hãy tự điền tên địa điểm thủ công bên dưới!
                    </div>
                  )}

                  {!isFetchingRealtime && realtimeSpots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {realtimeSpots.map((spot, idx) => (
                        <div
                          key={idx}
                          className="group relative border border-slate-100 dark:border-slate-800/60 p-2 flex items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl transition duration-200 gap-3"
                        >
                          <img
                            src={spot.image}
                            alt={spot.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover shrink-0 rounded-xl shadow-sm"
                          />
                          <div className="flex-1 min-w-0 pr-1 select-text">
                            <p className="text-[10px] font-bold text-slate-950 dark:text-white truncate uppercase" title={spot.name}>
                              {spot.name.split(',')[0]}
                            </p>
                            <p className="text-[8.5px] text-slate-500 dark:text-slate-405 truncate italic font-sans" title={spot.notes}>
                              {spot.notes}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                              <span className="text-[7px] bg-emerald-50 border border-emerald-100 px-1 py-0.2 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 font-bold uppercase shrink-0">
                                {spot.region}
                              </span>
                              <span className="text-[6.5px] text-slate-400 dark:text-slate-500 shrink-0">
                                ({spot.lat.toFixed(2)}°, {spot.lng.toFixed(2)}°)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            {/* Choose button to prefill form */}
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(spot)}
                              className="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-400 border-none rounded-lg text-[9px] font-black uppercase text-slate-900 cursor-pointer shadow-sm active:scale-95 transition"
                              title="Nạp dữ liệu vào biểu mẫu đăng ký bên dưới"
                            >
                              CHỌN
                            </button>
                            {/* Quick add button directly saves to traveler checklist */}
                            <button
                              type="button"
                              onClick={() => {
                                onSave({
                                  name: spot.name,
                                  region: spot.region,
                                  image: spot.image,
                                  lat: spot.lat,
                                  lng: spot.lng,
                                  notes: spot.notes,
                                  visited: false
                                });
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg text-[9px] font-black uppercase cursor-pointer shadow-sm active:scale-95 transition"
                              title="Ghim tức thời lên nhật trình bản đồ"
                            >
                              GHIM ⚡
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4.5">
                 {/* Name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                    ✦ TÊN ĐỊA ĐIỂM / DANH THẮNG: <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đồi chè Cầu Đất, Đà Lạt..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-205 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:bg-slate-950 placeholder-slate-400 dark:text-white text-xs font-semibold rounded-xl transition"
                    />
                  </div>
                  {isGeocoding && (
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 flex items-center gap-1 font-bold font-mono animate-pulse uppercase">
                      ⌛ ĐANG QUÉT TỌA ĐỘ VÀ TẢI ĐỊA DANH HÀNH CHÍNH...
                    </span>
                  )}
                  {geocodeError && (
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase mt-1 block font-mono">
                      ⚠️ LỖI: {geocodeError}
                    </span>
                  )}
                  {!isGeocoding && !geocodeError && initialLat !== undefined && initialLng !== undefined && (
                    <span className="text-[9px] text-emerald-500 font-extrabold uppercase mt-1 block font-mono">
                      ✔ ĐÃ TỰ ĐỘNG KHỚP VỚI ĐỊA CHỈ TRÊN BẢN ĐỒ THỰC TẾ!
                    </span>
                  )}
                </div>

                {/* Region & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                      ✦ KHU VỰC PHÂN PHỐI:
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl"
                    >
                      <option value="Miền Bắc">Miền Bắc</option>
                      <option value="Miền Trung">Miền Trung</option>
                      <option value="Miền Nam">Miền Nam</option>
                      <option value="Nước ngoài">Nước ngoài</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                      ✦ THỜI GIAN DỰ KIẾN:
                    </label>
                    <input
                      type="date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                      ✦ VĨ ĐỘ (LATITUDE):
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                      ✦ KINH ĐỘ (LONGITUDE):
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                    ✦ LIÊN KẾT ẢNH MINH HỌA (HTTP/HTTPS):
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/your-custom-photo-link..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl"
                  />
                  <span className="text-[8.5px] text-slate-450 dark:text-slate-500 mt-1 block uppercase font-mono">
                    MẸO: SẼ TỰ ĐỘNG GÁN SỐ LIỆU ẢNH DỮ LIỆU ĐẸP NẾU BẠN BỎ TRỐNG LIÊN KẾT!
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                    ✦ GHI CHÚ HÀNH TRÌNH CHIA SẺ:
                  </label>
                  <textarea
                    rows={2.5}
                    placeholder="Những góc Checkin đẹp, lưu ý tiền thuê xe, các món đặc sản cần ăn thử tại danh lam..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white text-xs font-semibold rounded-xl resize-none"
                  />
                </div>

                {/* Visited Status Checkbox */}
                <div className="flex items-center gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setVisited(!visited)}
                    className="shrink-0 focus:outline-none cursor-pointer"
                  >
                    {visited ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                        ✔
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950 block transition" />
                    )}
                  </button>
                  <label 
                    onClick={() => setVisited(!visited)}
                    className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none uppercase font-sans hover:text-indigo-500 transition"
                  >
                    ĐÃ CHINH PHỤC THÀNH CÔNG VÙNG ĐẤT NÀY?
                  </label>
                </div>

                {/* Submit Panel */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-full bg-slate-50 dark:bg-slate-850 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase cursor-pointer transition"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase rounded-full shadow-sm cursor-pointer transition active:scale-95"
                    id="save-new-location-button"
                  >
                    GHIM NGAY
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AddLocationModal;

