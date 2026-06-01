import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smile,
  MapPin,
  Search,
  Plus,
  Trash2,
  Moon,
  Sun,
  Map as MapIcon,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Award,
  Filter,
  AlertCircle
} from 'lucide-react';
import { TravelLocation, Region } from './types';
import { DEFAULT_LOCATIONS } from './data/defaultLocations';
import TravelMap from './components/TravelMap';
import AddLocationModal from './components/AddLocationModal';
import LocationCard from './components/LocationCard';
import ShareModal from './components/ShareModal';

// Helper function to convert Vietnamese text to accents-free format for accurate matches
function removeVietnameseTones(str: string): string {
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
  
  // Normalize system combining characters
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function App() {
  // Initialize locations with standard localStorage and fallbacks
  const [locations, setLocations] = useState<TravelLocation[]>(() => {
    const saved = localStorage.getItem('vietnam_travel_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_LOCATIONS;
  });

  // User interface options
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('travel_dark_mode');
    if (saved) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [regionFilter, setRegionFilter] = useState<Region>('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals/Drawers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Coordinates passed upon clicking on map to pre-fill standard forms
  const [clickedLat, setClickedLat] = useState<number | undefined>(undefined);
  const [clickedLng, setClickedLng] = useState<number | undefined>(undefined);

  // User real location coordinates (GPS tracking)
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);

  // Sharing links
  const [shareUrl, setShareUrl] = useState('');

  // Floating import request state (when loading shared itinerary)
  const [sharedItineraryToImport, setSharedItineraryToImport] = useState<TravelLocation[] | null>(null);

  // Map panning trigger mechanism (forces leaflet view reset on clicking map locate regardless of equality)
  const [mapPanTrigger, setMapPanTrigger] = useState<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Elegant floating notification alerts & confirm modals (iframe-safe)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Core Sync to local storage
  useEffect(() => {
    localStorage.setItem('vietnam_travel_locations', JSON.stringify(locations));
  }, [locations]);

  // Dark Mode side effects
  useEffect(() => {
    localStorage.setItem('travel_dark_mode', String(isDarkMode));
    const rootElement = document.documentElement;
    if (isDarkMode) {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Request browser Geolocation API permissions and retrieve coordinates dynamically
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
        },
        (error) => {
          console.warn("Quyền định vị bị tắt hoặc xảy ra lỗi GPS: ", error);
        }
      );
    }
  }, []);

  // Detect and import shared itinerary query strings (?itinerary=base64)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itineraryData = params.get('itinerary');
    if (itineraryData) {
      try {
        // Base64 decode supporting unicode/vietnamese accents safely
        const decodedString = decodeURIComponent(escape(atob(itineraryData)));
        const parsedLocations = JSON.parse(decodedString) as TravelLocation[];
        if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
          setSharedItineraryToImport(parsedLocations);
          // Clear query parameters in url bar silently to keep URL elegant
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        console.warn('Sai định dạng tệp chia sẻ: ', err);
      }
    }
  }, []);

  // Update dynamic sharing URL
  const handleOpenShare = () => {
    try {
      // Serialize current itinerary state to base64 safely
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(locations))));
      const computedUrl = `${window.location.origin}${window.location.pathname}?itinerary=${serialized}`;
      setShareUrl(computedUrl);
      setIsShareOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Confirm Import Shared list
  const handleConfirmImport = () => {
    if (sharedItineraryToImport) {
      // Generate fresh ids to dodge potential collisions
      const imported = sharedItineraryToImport.map(loc => ({
        ...loc,
        id: loc.id + '_shared_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString()
      }));
      setLocations(imported);
      setSharedItineraryToImport(null);
      setSelectedLocation(imported[0] || null);
      if (imported[0]) {
        setMapPanTrigger({ lat: imported[0].lat, lng: imported[0].lng, timestamp: Date.now() });
      }
    }
  };

  // Toggle checklist completed trip
  const handleToggleVisited = (id: string) => {
    setLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, visited: !loc.visited } : loc))
    );
    // If the active highlighted pinpoint is updated, sync state details
    if (selectedLocation?.id === id) {
      setSelectedLocation(prev => prev ? { ...prev, visited: !prev.visited } : null);
    }
  };

  // Delete elements via secure inline state dialog (completely iframe safe)
  const handleDeleteLocation = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa địa điểm',
      message: 'Bạn có chắc chắn muốn xóa địa điểm này ra khỏi hành trình danh lam thắng cảnh Việt Nam? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: () => {
        setLocations(prev => prev.filter(loc => loc.id !== id));
        if (selectedLocation?.id === id) {
          setSelectedLocation(null);
        }
        setConfirmDialog(null);
      }
    });
  };

  // Clear Checked elements ("Xóa dữ liệu điểm đã ghim đã đi")
  const handleClearVisited = () => {
    const completedCount = locations.filter(l => l.visited).length;
    if (completedCount === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Dọn dẹp trống',
        message: 'Hiện không có địa điểm nào được đánh dấu là "Đã hoàn thành" để dọn dẹp khỏi hành trình!'
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xóa tất cả điểm đã đi',
      message: `Bạn có chắc chắn muốn dọn dẹp và xóa hoàn toàn ${completedCount} danh lam đã ghim "Đã hoàn thành"?`,
      type: 'danger',
      onConfirm: () => {
        setLocations(prev => prev.filter(loc => !loc.visited));
        if (selectedLocation?.visited) {
          setSelectedLocation(null);
        }
        setConfirmDialog(null);
      }
    });
  };

  // Insert location
  const handleAddLocation = (newLocDetails: Omit<TravelLocation, 'id' | 'createdAt'>) => {
    const newLocation: TravelLocation = {
      ...newLocDetails,
      id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    setLocations(prev => [newLocation, ...prev]);
    setSelectedLocation(newLocation);
    setMapPanTrigger({ lat: newLocation.lat, lng: newLocation.lng, timestamp: Date.now() });
    // Reset temporary clicks
    setClickedLat(undefined);
    setClickedLng(undefined);
  };

  // Update inline travel notes (Ghi chú cá nhân)
  const handleUpdateNotes = (id: string, updatedText: string) => {
    setLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, notes: updatedText } : loc))
    );
    if (selectedLocation?.id === id) {
      setSelectedLocation(prev => prev ? { ...prev, notes: updatedText } : null);
    }
  };

  // Map Double-click handle to pre-fill latitude and longitude coordinates
  const handleMapClick = (lat: number, lng: number) => {
    setClickedLat(lat);
    setClickedLng(lng);
    setIsAddOpen(true);
  };

  // Reset standard database mapping (completely iframe safe)
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục bản đồ mẫu',
      message: 'Bạn có chắn chắn muốn khôi phục lại 8 địa danh chuẩn tiêu biểu trải dài đất nước Việt Nam? Toàn bộ các địa điểm tự ghim hiện tại của bạn sẽ bị thay thế hoàn toàn.',
      type: 'warning',
      onConfirm: () => {
        setLocations(DEFAULT_LOCATIONS);
        setSelectedLocation(null);
        setConfirmDialog(null);
      }
    });
  };

  // Printable vector view triggers browser print.
  const handlePrintPDF = () => {
    window.print();
  };

  // Filter & Search computation with Accent-Insensitive Vietnamese support
  const filteredLocations = locations.filter(loc => {
    const matchesRegion = regionFilter === 'Tất cả' || loc.region === regionFilter;
    
    // Apply accent reduction before keyword mapping
    const plainName = removeVietnameseTones(loc.name).toLowerCase();
    const plainNotes = removeVietnameseTones(loc.notes || '').toLowerCase();
    const plainSearch = removeVietnameseTones(searchTerm).toLowerCase();

    const matchesSearch = plainName.includes(plainSearch) || plainNotes.includes(plainSearch);
    return matchesRegion && matchesSearch;
  });

  // Achievement statistics
  const totalLocations = locations.length;
  const visitedLocations = locations.filter(l => l.visited).length;
  const completedPercent = totalLocations > 0 ? Math.round((visitedLocations / totalLocations) * 105 / 105 * 100) : 0;

  return (
    <div className="min-h-screen bg-orange-50/10 text-slate-850 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-100">
      
      {/* Shared Itinerary Import Overlay Notification Banner - Material style */}
      <AnimatePresence>
        {sharedItineraryToImport && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[99999] max-w-2xl mx-auto bg-indigo-650 bg-indigo-600 text-white p-5 rounded-2xl border border-indigo-500 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🧭</span>
              <div>
                <h4 className="text-xs font-black uppercase text-yellow-300">PHÁT HIỆN LỊCH TRÌNH CHIA SẺ!</h4>
                <p className="text-[10px] text-indigo-200 mt-0.5 font-sans">
                  Bạn nhận được danh sách gồm <b>{sharedItineraryToImport.length} địa danh</b> từ người quen. Bạn có muốn nhập danh sách này không?
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setSharedItineraryToImport(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold cursor-pointer transition"
              >
                BỎ QUA
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-[10px] font-bold cursor-pointer transition"
              >
                NHẬP NGAY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8 print:p-0 print:max-w-full">
        
        {/* Navigation & Header Panel */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 print:hidden select-none">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 transition duration-155 rounded-2xl shadow-md cursor-pointer flex items-center justify-center shrink-0">
              <Smile className="w-5.5 h-5.5 shrink-0" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  Cảm ơn Nhé 😊
                </h1>
                <span className="bg-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono shadow-sm">
                  MAP CHINH PHỤC
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-550 text-slate-550 text-slate-500 dark:text-slate-400 font-sans font-medium">
                ✦ GHIM CÁC ĐỊA DANH KÝ ỨC, KHÁM PHÁ DANH LAM VIỆT NAM HOÀN TOÀN MIỄN PHÍ
              </p>
            </div>
          </div>

          {/* Action buttons on utility bar */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end font-sans">
            
            {/* Dark mode toggler button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full bg-white hover:bg-slate-50 text-slate-750 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition text-[10px] font-bold uppercase cursor-pointer"
              title="Chuyển chế độ sáng/tối"
              id="theme-toggler"
            >
              {isDarkMode ? '☀ Sáng' : '🌙 Tối'}
            </button>

            {/* Set sample default trigger buttons */}
            <button
              onClick={handleResetData}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full bg-white hover:bg-slate-50 text-slate-705 dark:text-slate-350 text-slate-700 hover:text-indigo-600 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-650 text-indigo-600 dark:text-indigo-405 text-indigo-600" />
              <span>KHÔI PHỤC</span>
            </button>

            {/* Print out PDF */}
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full bg-white hover:bg-slate-50 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              title="Xuất bản in PDF"
              id="print-pdf-btn"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>XUẤT PDF</span>
            </button>

            {/* Social Share triggered buttons */}
            <button
              onClick={handleOpenShare}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full bg-white hover:bg-slate-50 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              title="Chia sẻ lộ trình này"
              id="share-btn"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-505 text-emerald-500" />
              <span>CHIA SẺ</span>
            </button>

            {/* Master Add Location button */}
            <button
              onClick={() => {
                setClickedLat(undefined);
                setClickedLng(undefined);
                setIsAddOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1.5 rounded-full shadow-sm cursor-pointer active:scale-95 transition"
              id="master-add-location-btn"
            >
              <Plus className="w-4 h-4 text-white shrink-0" />
              <span>THÊM ĐỊA DANH</span>
            </button>

          </div>
        </header>

        {/* PRINT-ONLY HEADER BANNER FOR PDF */}
        <div className="hidden print:block mb-8 text-center border-b-3 border-black pb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase font-mono mb-1">
            BẢN ĐỒ HÀNH TRÌNH DU LỊCH CÁ NHÂN
          </h1>
          <p className="text-xs text-slate-550 text-slate-500 font-mono">
            Tài liệu số hóa lưu trữ lịch trình danh lam thắng cảnh Việt Nam
          </p>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600 font-mono">
            <span>Tổng cộng: <b>{totalLocations} địa điểm</b></span>
            <span>Đã chinh phục: <b>{visitedLocations} địa điểm ({completedPercent}%)</b></span>
            <span>Ngày kết xuất: <b>{new Date().toLocaleDateString('vi-VN')}</b></span>
          </div>
        </div>

        {/* Dashboard Statistics & Analytics Board */}
        <section className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800/80 shadow-sm print:hidden select-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            
            {/* Progress bar visual ring text */}
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="relative shrink-0 flex items-center justify-center bg-yellow-105 bg-yellow-100 dark:bg-yellow-950/20 rounded-2xl p-3 text-yellow-700 shadow-sm">
                <Award className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5 w-full font-sans">
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">📊 TIẾN ĐỘ CHINH PHỤC</span>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase">
                    CHINH PHỤC: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{completedPercent}%</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {visitedLocations} / {totalLocations} HOÀN THÀNH
                  </span>
                </div>
                {/* Visual Progress bar container */}
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-3.5 rounded-full overflow-hidden relative border border-slate-150/20 dark:border-slate-800">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${completedPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stat badges details column 2 */}
            <div className="grid grid-cols-2 gap-4 col-span-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/80 md:pl-6 pt-4 md:pt-0 font-sans">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase block tracking-wider">ĐANG LÊN KẾ HOẠCH</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                  <span className="w-3.5 h-3.5 bg-yellow-405 bg-yellow-400 rounded-full inline-block shadow-sm"></span>
                  <span>{totalLocations - visitedLocations} ĐIỂM</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase block tracking-wider">ĐÃ ĐẶT CHÂN ĐẾN</span>
                <p className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5 uppercase">
                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full inline-block shadow-sm"></span>
                  <span>{visitedLocations} ĐIỂM</span>
                </p>
              </div>
            </div>

            {/* Quick cleaning action panel column 3 */}
            <div className="flex flex-col items-stretch justify-center md:items-end col-span-1 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/80 md:pl-6">
              <div className="space-y-1.5 w-full md:text-right font-sans">
                <span className="text-[8px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider block">CÔNG CỤ NỔI BẬT</span>
                
                {/* "Clear checked" button to delete ALL items that are visited */}
                <button
                  onClick={handleClearVisited}
                  disabled={visitedLocations === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 text-[10px] font-extrabold uppercase rounded-full cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition shadow-sm"
                  title="Dọn dẹp và xóa các điểm đã hoàn thành chuyến đi"
                  id="clear-visited-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>XÓA ĐIỂM ĐÃ ĐI ({visitedLocations})</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Dashboard Interactive Main Content Grid panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL COLUMN (Map Widget Box) */}
          <div className="lg:col-span-12 xl:col-span-12 space-y-6 print:hidden">
            
            {/* Live active Leaflet map box widget with Google layer */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest select-none font-mono">
                <span className="flex items-center gap-1.5 font-sans">
                  <MapIcon className="w-4 h-4 text-indigo-600" />
                  BẢN ĐỒ VIỆT NAM (TỔNG HỢP GỢI Ý REALTIME)
                </span>
                {selectedLocation && (
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                    }}
                    className="text-[9px] font-bold border border-slate-205 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full uppercase cursor-pointer transition"
                  >
                    [-] TIÊU CỰ CHUNG
                  </button>
                )}
              </div>

              {/* Subdued message box helper */}
              <div className="h-[380px] md:h-[480px] rounded-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800/60 shadow-inner">
                <TravelMap
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={(loc) => {
                    setSelectedLocation(loc);
                    setMapPanTrigger({ lat: loc.lat, lng: loc.lng, timestamp: Date.now() });
                  }}
                  onMapClick={handleMapClick}
                  isDarkMode={isDarkMode}
                  userLat={userLat}
                  userLng={userLng}
                  mapPanTrigger={mapPanTrigger}
                />
              </div>

              <span className="text-[8.5px] text-slate-450 dark:text-slate-550 dark:text-slate-500 block leading-tight text-center select-none uppercase font-semibold font-mono tracking-wider">
                📌 CLICK VÀO BẤT CỨ ĐIỂM NÀO TRÊN BẢN ĐỒ ĐỂ DÒ TÌM, GỢI Ý VÀ GHIM HOÀN TOÀN TỰ ĐỘNG!
              </span>
            </div>

          </div>

          {/* RIGHT PANEL COLUMN (Filtered search bar and Locations List grid) */}
          <div className="lg:col-span-12 xl:col-span-12 space-y-6 print:col-span-12">
            
            {/* Filter and search bar controls header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4 print:hidden select-none">
              
              {/* Region and Area selection filtering (bộ lọc theo khu vực) */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Filter className="w-3.5 h-3.5 text-indigo-500" />
                  <span>BỘ LỌC KHU VỰC ĐỊA LÝ:</span>
                </label>
                
                {/* Horizontal chips selection list */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {(['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Nước ngoài'] as Region[]).map(reg => (
                    <button
                      key={reg}
                      onClick={() => setRegionFilter(reg)}
                      className={`px-3.5 py-1.5 transition text-[10.5px] uppercase font-bold rounded-full cursor-pointer ${
                        regionFilter === reg
                          ? 'bg-indigo-650 bg-indigo-600 text-white shadow-sm font-extrabold'
                          : 'bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      id={`filter-${reg}`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyword text search box */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  <span>TÌM KIẾM THEO TÊN (HỖ TRỢ KHÔNG DẤU):</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Gõ nhanh tên danh thắng hoặc nội dung ghi chú để tra cứu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4.5 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-850 dark:text-white text-xs font-semibold bg-slate-50 transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3.5 top-2 py-1 px-3 text-[9px] font-black bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 dark:bg-rose-950/20 rounded-full cursor-pointer transition uppercase"
                    >
                      XÓA
                    </button>
                  )}
                </div>
              </div>
              
              {/* Highlight statistics metrics of current filters search results */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
                <span>
                  ĐANG HIỂN THỊ: <b>{filteredLocations.length}</b> ĐỊA DANH / <b>{totalLocations}</b> TỔNG SỐ
                </span>
                {selectedLocation && (
                  <span>
                    MỤC TIÊU PIN: <b>{selectedLocation.name.toUpperCase()}</b>
                  </span>
                )}
              </div>

            </div>

            {/* Travel Items grids cards lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 print:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(loc => (
                    <LocationCard
                      key={loc.id}
                      location={loc}
                      isSelected={selectedLocation?.id === loc.id}
                      onSelect={() => {
                        setSelectedLocation(loc);
                        setMapPanTrigger({ lat: loc.lat, lng: loc.lng, timestamp: Date.now() });
                      }}
                      onToggleVisited={() => handleToggleVisited(loc.id)}
                      onDelete={() => handleDeleteLocation(loc.id)}
                      onUpdateNotes={(txt) => handleUpdateNotes(loc.id, txt)}
                    />
                  ))
                ) : (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 space-y-4 shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Không tìm thấy địa điểm phù hợp</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                        Thử nhập từ khóa khác, tìm gõ có dấu/không dấu hoặc lọc lại khu vực khác!
                      </p>
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => { setSearchTerm(''); setRegionFilter('Tất cả'); }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Hiển thị hoàn toàn bộ
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PRINT-ONLY SIMPLE TEXT-MAP DATA LIST */}
            <div className="hidden print:block w-full mt-10">
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-4">
                DANH SÁCH CHI TIẾT CÁC ĐỊA ĐIỂM HÀNH TRÌNH
              </h2>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 font-bold bg-slate-50">
                    <th className="py-2.5 px-2">STT</th>
                    <th className="py-2.5 px-2">Tên Danh Thắng</th>
                    <th className="py-2.5 px-2">Vùng Miền</th>
                    <th className="py-2.5 px-2">Trạng Thái</th>
                    <th className="py-2.5 px-2">Kế hoạch</th>
                    <th className="py-2.5 px-2">Ghi chú cá nhân</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, idx) => (
                    <tr key={loc.id} className="border-b text-slate-800">
                      <td className="py-3 px-2 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-2 font-bold">{loc.name}</td>
                      <td className="py-3 px-2 font-bold text-indigo-700">{loc.region}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.visited ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                          {loc.visited ? 'ĐÃ HOÀN THÀNH' : 'ĐỊNH GHÉ THĂM'}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono">{loc.plannedDate ? loc.plannedDate : '---'}</td>
                      <td className="py-3 px-2 italic text-slate-600 max-w-xs break-words">{loc.notes ? loc.notes : '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 text-[11px] text-slate-400 text-center font-mono select-none">
                Cảm ơn bạn đã sử dụng Cảm ơn Nhé. Chúc bạn có những chặng đường tuyệt vời!
              </div>
            </div>

          </div>

        </section>

        {/* Intro Message and Local Storage Confirmation Footer */}
        <footer className="pt-6 border-t border-slate-150 dark:border-slate-900 select-none print:hidden">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-indigo-50 to-indigo-50/30 dark:from-indigo-950/20 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40 text-center space-y-3">
            <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Thư gửi từ người kiến tạo
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
              "Xin chào, Tôi là Trung tôi thích du lịch nên đã tạo ra Bản đồ cá nhân này, Hoàn toàn miễn phí nhé. &lt;3"
            </p>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal bg-white/60 dark:bg-slate-950/40 py-1.5 px-3 rounded-xl inline-block border border-slate-200/50 dark:border-slate-800/40">
              💾 <b>Dữ liệu ngoại tuyến:</b> Toàn bộ bản đồ mẫu, các điểm lưu mới, ghi chú cá nhân của bạn sẽ được tự động lưu trữ tức thì và bảo mật hoàn toàn trong bộ nhớ máy (<b>Local Storage</b>) - hoạt động mượt mà trên tất cả các loại thiết bị (máy tính, máy tính bảng, điện thoại di động).
            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide">
            CẢM ƠN NHÉ © 2026. KIẾN TẠO VỚI TỐI GIẢN & SỰ TIỆN LỢI CHI TIẾT.
          </div>
        </footer>

      </div>

      {/* Drawer modal elements dynamically added */}
      <AddLocationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddLocation}
        initialLat={clickedLat}
        initialLng={clickedLng}
        isDarkMode={isDarkMode}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={shareUrl}
      />

      {/* Sleek Custom Alert Dialog Modal Overlay (Strict layout constraints & mobile friendly) */}
      <AnimatePresence>
        {alertDialog && (
          <div className="fixed inset-0 z-[110000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-extrabold tracking-tight dark:text-white">
                  {alertDialog.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
                {alertDialog.message}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setAlertDialog(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sleek Custom Confirmation Multi-Option Dialog Overlay */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[110000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20'
                    : 'bg-amber-50 text-amber-500 dark:bg-amber-950/20'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold tracking-tight dark:text-white">
                  {confirmDialog.title}
                </h3>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
                {confirmDialog.message}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition cursor-pointer ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/10'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/10'
                  }`}
                >
                  Chấp nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
