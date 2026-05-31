import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, MapPin, Calendar, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { TravelLocation } from '../types';
import { BEAUTIFUL_PRESETS } from '../data/defaultLocations';

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

  // Sync clicked coordinates from map if any and perform reverse geocoding via OpenStreetMap/Nominatim API
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined && isOpen) {
      const fixedLat = Number(initialLat.toFixed(5));
      const fixedLng = Number(initialLng.toFixed(5));
      setLat(fixedLat);
      setLng(fixedLng);

      // Auto assign fallback template region based on latitude
      if (fixedLat > 19) setRegion('Miền Bắc');
      else if (fixedLat > 14) setRegion('Miền Trung');
      else setRegion('Miền Nam');

      // Trigger automatic place geocoding
      setIsGeocoding(true);
      setGeocodeError(null);
      setName('Đang định vị địa chỉ thực tế...');

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
              // Extract specific place name components (e.g. amenity or tourist spot)
              const mainPlace = addr.amenity || addr.tourism || addr.historic || addr.natural || addr.shop || addr.railway || addr.highway || addr.attraction || addr.place || addr.village || addr.town || addr.suburb || addr.road;
              const district = addr.city_district || addr.district || addr.county;
              const city = addr.city || addr.state || addr.province;

              if (mainPlace) {
                guessedName = mainPlace;
                if (district) guessedName += `, ${district}`;
                if (city) guessedName += `, ${city}`;
              }
            }

            if (!guessedName) {
              // Parse displays nicely as compact path
              const parts = data.display_name.split(',');
              const filteredParts = parts.filter((p: string) => !/^\d+$/.test(p.trim()) && p.trim() !== 'Việt Nam');
              guessedName = filteredParts.slice(0, 3).join(', ').trim();
            }

            setName(guessedName);
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

      fetchAddress();

      return () => {
        controller.abort();
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Thêm Địa Điểm Ghé Thăm Mới
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                id="close-add-location-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
              {/* Preset Cards Suggestion */}
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-2.5">
                  🛡️ Sử dụng nhanh địa điểm mẫu tuyệt đẹp:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BEAUTIFUL_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="group relative h-14 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center text-left hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow transition-all duration-200"
                    >
                      <img
                        src={preset.image}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-full object-cover shrink-0 relative transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="p-1.5 overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                          {preset.name.split(',')[0]}
                        </p>
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded uppercase font-semibold">
                          {preset.region}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tên Địa Điểm / Danh Thắng: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      {isGeocoding ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đồi chè Cầu Đất, Đà Lạt..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-850 dark:border-slate-800 dark:text-white transition-all text-xs"
                    />
                  </div>
                  {isGeocoding && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1 font-medium animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang phân tích tọa độ & tải địa chỉ thực tế từ bản đồ...
                    </span>
                  )}
                  {geocodeError && (
                    <span className="text-[10px] text-rose-500 mt-1.5 block">
                      ⚠️ {geocodeError}
                    </span>
                  )}
                  {!isGeocoding && !geocodeError && initialLat !== undefined && initialLng !== undefined && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block font-medium">
                      ✓ Đã tự động điền địa chỉ hành chính thực tế từ điểm đã ghim!
                    </span>
                  )}
                </div>

                {/* Region & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Khu vực phân bố:
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    >
                      <option value="Miền Bắc">Miền Bắc</option>
                      <option value="Miền Trung">Miền Trung</option>
                      <option value="Miền Nam">Miền Nam</option>
                      <option value="Nước ngoài">Nước ngoài</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Thời gian dự kiến (Không bắt buộc):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={plannedDate}
                        onChange={(e) => setPlannedDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Vĩ độ (Latitude):
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Kinh độ (Longitude):
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Liên kết hình ảnh (Đường dẫn HTTP/HTTPS):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/your-custom-photo-link..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Mẹo: Có thể dán trực tiếp bất kỳ link ảnh Unsplash hoặc Google nào để hiển thị. Nếu để trống, hệ thống sẽ tự sinh ảnh ngẫu nhiên quyến rũ!
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Ghi chú hành trình & Kế hoạch cá nhân:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Những món cần ăn, các góc chụp ảnh đẹp, dịch vụ cần thuê, vật dụng bảo hộ cần chuẩn bị..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs resize-none"
                  />
                </div>

                {/* Visited Status Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="visited-checkbox-input"
                    checked={visited}
                    onChange={(e) => setVisited(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-emerald-500"
                  />
                  <label htmlFor="visited-checkbox-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Đã hoàn thành chuyến đi này rồi? (Tick để đánh dấu)
                  </label>
                </div>

                {/* Submit Panel */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 font-bold text-xs transition"
                    id="save-new-location-button"
                  >
                    Thêm Vào Danh Sách
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
