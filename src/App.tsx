import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Sparkles,
  SearchX,
  Plus,
  RotateCcw,
  FolderOpen,
  Share2,
  X,
} from 'lucide-react';
import { TravelLocation, Region } from './types';
import { DEFAULT_LOCATIONS } from './data/defaultLocations';
import {
  copyText,
  createId,
  distanceKm,
  formatDateVi,
  isDesktopLayout,
  locationsFromCSV,
  locationsToCSV,
  mergeLocations,
  normalizeSearch,
  parseLocalDate,
  saveFile,
  splitName,
} from './lib/utils';
import { useToasts } from './hooks/useToasts';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useScrollSpy } from './hooks/useScrollSpy';
import TravelMap from './components/TravelMap';
import AddLocationModal from './components/AddLocationModal';
import EditLocationModal from './components/EditLocationModal';
import LocationCard from './components/LocationCard';
import LocationRow from './components/LocationRow';
import ShareModal from './components/ShareModal';
import AppHeader from './components/AppHeader';
import ToolsMenu from './components/ToolsMenu';
import StatsHero from './components/StatsHero';
import FilterBar, { SortKey, StatusFilter, ViewMode, SORT_LABELS } from './components/FilterBar';
import BottomNav, { SectionId } from './components/BottomNav';
import ConfirmDialog, { ConfirmOptions } from './components/ConfirmDialog';
import Toaster from './components/Toaster';

const STORAGE_KEY = 'vietnam_travel_locations';
const SECTIONS: SectionId[] = ['tong-quan', 'ban-do', 'dia-diem'];

function loadLocations(): TravelLocation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_LOCATIONS;
}

export default function App() {
  // ---------------------------------------------------------------- state
  const [locations, setLocations] = useState<TravelLocation[]>(loadLocations);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('travel_dark_mode');
    if (saved) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Selection/navigation/editing are stored by id so they never go stale
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navTargetId, setNavTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // List controls (sort & view are remembered between visits)
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [region, setRegion] = useState<Region>('Tất cả');
  const [sort, setSort] = useLocalStorageState<SortKey>('cam_on_nhe_sort', 'recent', (v) =>
    typeof v === 'string' && v in SORT_LABELS
  );
  const [view, setView] = useLocalStorageState<ViewMode>('cam_on_nhe_view', 'grid', (v) => v === 'grid' || v === 'list');

  // Overlays
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsAnchor, setToolsAnchor] = useState<DOMRect | null>(null);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
  const [sharedItineraryToImport, setSharedItineraryToImport] = useState<TravelLocation[] | null>(null);

  // Map interaction
  const [clickedLat, setClickedLat] = useState<number | undefined>(undefined);
  const [clickedLng, setClickedLng] = useState<number | undefined>(undefined);
  const [mapPanTrigger, setMapPanTrigger] = useState<{ lat: number; lng: number; timestamp: number } | null>(null);
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  const activeSection = useScrollSpy(SECTIONS);

  const selectedLocation = useMemo(() => locations.find((l) => l.id === selectedId) ?? null, [locations, selectedId]);
  const navTarget = useMemo(() => locations.find((l) => l.id === navTargetId) ?? null, [locations, navTargetId]);
  const editingLocation = useMemo(() => locations.find((l) => l.id === editingId) ?? null, [locations, editingId]);

  // -------------------------------------------------------------- effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    } catch (e) {
      console.error(e);
    }
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('travel_dark_mode', String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Continuously track the user's GPS position (realtime) for live navigation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      },
      (error) => {
        console.warn('Quyền định vị bị tắt hoặc xảy ra lỗi GPS: ', error);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ESC exits the fullscreen map
  useEffect(() => {
    if (!isMapFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMapFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMapFullscreen]);

  // Detect a shared itinerary in the URL (?itinerary=base64)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itineraryData = params.get('itinerary');
    if (!itineraryData) return;
    try {
      const decoded = decodeURIComponent(escape(atob(itineraryData)));
      const parsed = JSON.parse(decoded) as TravelLocation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSharedItineraryToImport(parsed);
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
      }
    } catch (err) {
      console.warn('Sai định dạng liên kết chia sẻ: ', err);
    }
  }, []);

  // ------------------------------------------------------------- derived
  // Distances refresh only when the user moves ~100 m, to keep the list calm
  const gpsKey = userLat !== undefined && userLng !== undefined ? `${userLat.toFixed(3)},${userLng.toFixed(3)}` : '';
  const distances = useMemo(() => {
    const result: Record<string, number> = {};
    if (!gpsKey) return result;
    const [glat, glng] = gpsKey.split(',').map(Number);
    locations.forEach((l) => {
      result[l.id] = distanceKm(glat, glng, l.lat, l.lng);
    });
    return result;
  }, [locations, gpsKey]);
  const hasGps = gpsKey !== '';

  const counts = useMemo(
    () => ({
      all: locations.length,
      todo: locations.filter((l) => !l.visited).length,
      done: locations.filter((l) => l.visited).length,
    }),
    [locations]
  );

  const regionCounts = useMemo(() => {
    const result: Record<string, number> = {};
    locations.forEach((l) => {
      result[l.region] = (result[l.region] ?? 0) + 1;
    });
    return result;
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const q = normalizeSearch(search);
    const list = locations.filter((l) => {
      if (status === 'todo' && l.visited) return false;
      if (status === 'done' && !l.visited) return false;
      if (region !== 'Tất cả' && l.region !== region) return false;
      if (!q) return true;
      return normalizeSearch(l.name).includes(q) || normalizeSearch(l.notes || '').includes(q);
    });

    const effectiveSort = sort === 'distance' && !hasGps ? 'recent' : sort;
    if (effectiveSort === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    if (effectiveSort === 'date') {
      const time = (l: TravelLocation) => parseLocalDate(l.plannedDate)?.getTime() ?? Infinity;
      return [...list].sort((a, b) => time(a) - time(b));
    }
    if (effectiveSort === 'distance') {
      return [...list].sort((a, b) => (distances[a.id] ?? Infinity) - (distances[b.id] ?? Infinity));
    }
    return list; // 'recent': newest additions are kept at the front of the array
  }, [locations, search, status, region, sort, distances, hasGps]);

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || region !== 'Tất cả';
  const visitedCount = counts.done;
  const completedPercent = counts.all ? Math.round((counts.done / counts.all) * 100) : 0;

  // ------------------------------------------------------------- helpers
  const scrollToSection = useCallback((id: SectionId) => {
    if (id === 'tong-quan') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** On phones the map sits above the list, so bring it into view after an action. */
  const revealMap = useCallback(() => {
    if (!isDesktopLayout() && !isMapFullscreen) scrollToSection('ban-do');
  }, [isMapFullscreen, scrollToSection]);

  const titleOf = (loc: TravelLocation) => splitName(loc.name).title;

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setRegion('Tất cả');
  };

  // ------------------------------------------------------------- actions
  const handleSelect = (loc: TravelLocation) => {
    setSelectedId(loc.id);
    setMapPanTrigger({ lat: loc.lat, lng: loc.lng, timestamp: Date.now() });
    revealMap();
  };

  const handleNavigate = (loc: TravelLocation) => {
    setSelectedId(loc.id);
    setNavTargetId(loc.id);
    revealMap();
  };

  const handleToggleVisited = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, visited: !l.visited } : l)));
    if (!loc.visited) showToast(`🎉 Đã chinh phục ${titleOf(loc)}!`);
  };

  const handleDelete = (id: string) => {
    const index = locations.findIndex((l) => l.id === id);
    if (index < 0) return;
    const removed = locations[index];
    setLocations((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (navTargetId === id) setNavTargetId(null);
    if (editingId === id) setEditingId(null);
    showToast(`Đã xóa “${titleOf(removed)}”`, {
      tone: 'info',
      actionLabel: 'Hoàn tác',
      onAction: () =>
        setLocations((prev) =>
          prev.some((l) => l.id === removed.id)
            ? prev
            : [...prev.slice(0, index), removed, ...prev.slice(index)]
        ),
    });
  };

  /** Replace the whole list but keep an undo for a few seconds. */
  const replaceAllWithUndo = (next: TravelLocation[], message: string) => {
    const snapshot = locations;
    setLocations(next);
    setSelectedId(null);
    setNavTargetId(null);
    showToast(message, { actionLabel: 'Hoàn tác', onAction: () => setLocations(snapshot) });
  };

  const handleClearVisited = () => {
    if (visitedCount === 0) return;
    setConfirm({
      title: 'Xóa các điểm đã đi?',
      message: `${visitedCount} địa điểm đã đánh dấu "Đã đi" sẽ được xóa khỏi danh sách.`,
      tone: 'danger',
      confirmLabel: `Xóa ${visitedCount} điểm`,
      onConfirm: () =>
        replaceAllWithUndo(
          locations.filter((l) => !l.visited),
          `Đã dọn ${visitedCount} điểm đã đi`
        ),
    });
  };

  const handleResetData = () => {
    setConfirm({
      title: 'Khôi phục dữ liệu mẫu?',
      message: 'Danh sách hiện tại sẽ được thay bằng 8 địa danh tiêu biểu của Việt Nam. Bạn vẫn có thể hoàn tác ngay sau đó.',
      tone: 'warning',
      confirmLabel: 'Khôi phục',
      onConfirm: () => replaceAllWithUndo(DEFAULT_LOCATIONS, 'Đã khôi phục dữ liệu mẫu'),
    });
  };

  const handleAddLocation = (details: Omit<TravelLocation, 'id' | 'createdAt'>) => {
    const newLocation: TravelLocation = {
      ...details,
      id: createId('loc'),
      createdAt: new Date().toISOString(),
    };
    setLocations((prev) => [newLocation, ...prev]);
    setSelectedId(newLocation.id);
    setMapPanTrigger({ lat: newLocation.lat, lng: newLocation.lng, timestamp: Date.now() });
    setClickedLat(undefined);
    setClickedLng(undefined);
    showToast(`📍 Đã ghim ${titleOf(newLocation)}`);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
    showToast('Đã lưu ghi chú');
  };

  const handleSaveEdit = (updated: TravelLocation) => {
    setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingId(null);
    showToast('Đã cập nhật địa điểm');
  };

  const handleCopyCoords = async (loc: TravelLocation) => {
    const ok = await copyText(`${loc.lat}, ${loc.lng}`);
    showToast(ok ? 'Đã sao chép tọa độ' : 'Không sao chép được tọa độ', { tone: ok ? 'success' : 'error' });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedLat(lat);
    setClickedLng(lng);
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setClickedLat(undefined);
    setClickedLng(undefined);
    setIsAddOpen(true);
  };

  const handleOpenShare = () => {
    try {
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(locations))));
      setShareUrl(`${window.location.origin}${window.location.pathname}?itinerary=${serialized}`);
      setIsShareOpen(true);
    } catch (e) {
      console.error(e);
      showToast('Không tạo được liên kết chia sẻ', { tone: 'error' });
    }
  };

  const handleExportCSV = async () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    const result = await saveFile(
      `cam-on-nhe-lich-trinh-${dateTag}.csv`,
      locationsToCSV(locations),
      'text/csv;charset=utf-8'
    );
    if (result === 'downloaded') showToast(`Đã lưu ${locations.length} địa điểm ra file CSV`);
    if (result === 'shared') showToast('Đã gửi file CSV — chọn “Lưu vào Tệp” để cất vào iCloud');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let imported: TravelLocation[];
      try {
        imported = locationsFromCSV(String(reader.result || ''));
      } catch {
        setConfirm({
          title: 'Không đọc được file CSV',
          message: 'File chưa đúng định dạng. Hãy dùng file đã lưu từ ứng dụng này (cần có các cột name, lat, lng).',
          tone: 'warning',
          alertOnly: true,
        });
        return;
      }
      setConfirm({
        title: 'Mở file CSV',
        message: (
          <>
            Tìm thấy <b>{imported.length} địa điểm</b> trong “{file.name}”. Gộp vào danh sách hiện tại hay thay thế toàn bộ?
          </>
        ),
        tone: 'info',
        confirmLabel: 'Gộp thêm',
        secondaryLabel: 'Thay thế toàn bộ',
        onConfirm: () => {
          const { merged, added } = mergeLocations(locations, imported);
          replaceAllWithUndo(merged, added ? `Đã gộp thêm ${added} địa điểm mới` : 'Không có địa điểm mới — tất cả đã có sẵn');
        },
        onSecondary: () => replaceAllWithUndo(imported, `Đã nạp ${imported.length} địa điểm từ file`),
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSharedImport = (mode: 'merge' | 'replace') => {
    if (!sharedItineraryToImport) return;
    const incoming = sharedItineraryToImport.map((loc) => ({ ...loc, createdAt: loc.createdAt || new Date().toISOString() }));
    setSharedItineraryToImport(null);
    if (mode === 'merge') {
      const { merged, added } = mergeLocations(locations, incoming);
      replaceAllWithUndo(merged, `Đã thêm ${added} địa điểm từ lịch trình được chia sẻ`);
    } else {
      replaceAllWithUndo(incoming, `Đã nhập ${incoming.length} địa điểm được chia sẻ`);
    }
    if (incoming[0]) {
      setSelectedId(incoming[0].id);
      setMapPanTrigger({ lat: incoming[0].lat, lng: incoming[0].lng, timestamp: Date.now() });
    }
  };

  const openTools = (anchor: DOMRect | null) => {
    setToolsAnchor(anchor);
    setToolsOpen(true);
  };

  // ------------------------------------------------------------- render
  const itemProps = (loc: TravelLocation) => ({
    location: loc,
    isSelected: selectedId === loc.id,
    distanceKm: distances[loc.id],
    onSelect: () => handleSelect(loc),
    onNavigate: () => handleNavigate(loc),
    onToggleVisited: () => handleToggleVisited(loc.id),
    onEdit: () => setEditingId(loc.id),
    onDelete: () => handleDelete(loc.id),
    onCopyCoords: () => handleCopyCoords(loc),
    onUpdateNotes: (notes: string) => handleUpdateNotes(loc.id, notes),
  });

  const chipButton =
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition';

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      {/* Shared itinerary banner */}
      <AnimatePresence>
        {sharedItineraryToImport && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-3 inset-x-3 z-[99999] max-w-2xl mx-auto rounded-3xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-4 shadow-2xl print:hidden"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Bạn nhận được một lịch trình!</p>
                <p className="text-xs opacity-75 mt-0.5">
                  Gồm {sharedItineraryToImport.length} địa danh từ người quen. Thêm vào bản đồ của bạn nhé?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSharedImport('merge')}
                    className="h-9 px-3.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition"
                  >
                    Thêm vào của tôi
                  </button>
                  <button
                    onClick={() => handleSharedImport('replace')}
                    className="h-9 px-3.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 dark:bg-slate-100 dark:hover:bg-slate-200 transition"
                  >
                    Thay thế toàn bộ
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSharedItineraryToImport(null)}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-white/10 dark:hover:bg-slate-100 transition"
                aria-label="Bỏ qua"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader
        isDarkMode={isDarkMode}
        onToggleDark={() => setIsDarkMode((d) => !d)}
        onOpenTools={(rect) => openTools(rect)}
        onAdd={openAdd}
        toolsOpen={toolsOpen}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 lg:pb-12 space-y-5 sm:space-y-6 print:p-0 print:max-w-full">
        <StatsHero locations={locations} distances={distances} onSelect={handleSelect} onAdd={openAdd} />

        {/* Print-only heading */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-300 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mb-1">
            Bản đồ hành trình du lịch cá nhân
          </h1>
          <p className="text-xs text-slate-500">Cảm ơn Nhé — lịch trình danh lam thắng cảnh</p>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600">
            <span>Tổng cộng: <b>{counts.all} địa điểm</b></span>
            <span>Đã chinh phục: <b>{counts.done} ({completedPercent}%)</b></span>
            <span>Ngày xuất: <b>{new Date().toLocaleDateString('vi-VN')}</b></span>
          </div>
        </div>

        {/* grid-cols-1 (minmax(0,1fr)) stops wide rows like the chip scroller from blowing out the column on phones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* ---------------- Map (right & sticky on desktop) ---------------- */}
          <section id="ban-do" className="lg:col-span-7 lg:order-2 lg:sticky lg:top-20 print:hidden">
            <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-sm p-2 sm:p-2.5">
              <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2.5">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                    <MapIcon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    Bản đồ
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {selectedLocation ? `Đang xem: ${titleOf(selectedLocation)}` : 'Chạm vào bản đồ để ghim điểm mới'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedLocation && (
                    <button onClick={() => setSelectedId(null)} className={chipButton}>
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bỏ chọn</span>
                    </button>
                  )}
                  <button onClick={() => setIsMapFullscreen(true)} className={chipButton} title="Phóng to bản đồ toàn màn hình">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Toàn màn hình
                  </button>
                </div>
              </div>

              <div
                className={
                  isMapFullscreen
                    ? 'fixed inset-0 z-[9999] overflow-hidden bg-white dark:bg-slate-950'
                    : 'relative h-[56vh] min-h-[340px] max-h-[540px] lg:h-[calc(100vh-11rem)] lg:min-h-[420px] lg:max-h-none rounded-2xl overflow-hidden'
                }
              >
                {isMapFullscreen && (
                  <button
                    onClick={() => setIsMapFullscreen(false)}
                    className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 text-white h-9 px-4 rounded-full shadow-lg text-xs font-semibold backdrop-blur transition"
                    title="Thu nhỏ bản đồ (ESC)"
                  >
                    <Minimize2 className="w-3.5 h-3.5" /> Thu nhỏ bản đồ
                  </button>
                )}
                <TravelMap
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={(loc) => {
                    setSelectedId(loc.id);
                    setMapPanTrigger({ lat: loc.lat, lng: loc.lng, timestamp: Date.now() });
                  }}
                  onMapClick={handleMapClick}
                  isDarkMode={isDarkMode}
                  userLat={userLat}
                  userLng={userLng}
                  mapPanTrigger={mapPanTrigger}
                  navTarget={navTarget}
                  onStopNavigation={() => setNavTargetId(null)}
                />
              </div>
            </div>
          </section>

          {/* ---------------- List (left on desktop) ---------------- */}
          <section id="dia-diem" className="lg:col-span-5 lg:order-1 space-y-3.5 print:col-span-12">
            <div className="flex items-end justify-between gap-3 px-1 print:hidden">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Địa điểm của bạn</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? `Hiển thị ${filteredLocations.length}/${counts.all} địa điểm`
                    : `${counts.all} địa điểm · ${counts.done} đã đi`}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <FilterBar
              search={search}
              onSearch={setSearch}
              status={status}
              onStatus={setStatus}
              region={region}
              onRegion={setRegion}
              sort={sort}
              onSort={setSort}
              view={view}
              onView={setView}
              counts={counts}
              regionCounts={regionCounts}
              hasGps={hasGps}
            />

            <div className="print:hidden">
              {locations.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-6 py-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-3xl">
                    🗺️
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Chưa có địa điểm nào</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Chạm vào bản đồ, tìm kiếm hoặc bấm “Thêm địa điểm” để bắt đầu hành trình của bạn.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={openAdd}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/25"
                    >
                      <Plus className="w-4 h-4" /> Thêm địa điểm
                    </button>
                    <button onClick={() => replaceAllWithUndo(DEFAULT_LOCATIONS, 'Đã nạp dữ liệu mẫu')} className={`${chipButton} h-10 text-sm`}>
                      <RotateCcw className="w-4 h-4" /> Dùng dữ liệu mẫu
                    </button>
                    <button onClick={() => csvInputRef.current?.click()} className={`${chipButton} h-10 text-sm`}>
                      <FolderOpen className="w-4 h-4" /> Mở file CSV
                    </button>
                  </div>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-6 py-10 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <SearchX className="w-7 h-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Không tìm thấy địa điểm phù hợp</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Thử từ khóa khác (gõ có dấu hay không dấu đều được) hoặc bỏ bớt bộ lọc.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 h-10 px-4 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredLocations.map((loc) => (
                      <LocationCard key={loc.id} {...itemProps(loc)} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredLocations.map((loc) => (
                      <LocationRow key={loc.id} {...itemProps(loc)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Print-only table */}
            <div className="hidden print:block w-full mt-6">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-4">
                Danh sách chi tiết các địa điểm
              </h2>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-600 font-bold bg-slate-50">
                    <th className="py-2.5 px-2">STT</th>
                    <th className="py-2.5 px-2">Tên danh thắng</th>
                    <th className="py-2.5 px-2">Vùng miền</th>
                    <th className="py-2.5 px-2">Trạng thái</th>
                    <th className="py-2.5 px-2">Kế hoạch</th>
                    <th className="py-2.5 px-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, idx) => (
                    <tr key={loc.id} className="border-b text-slate-800 break-inside-avoid">
                      <td className="py-3 px-2 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-2 font-bold">{loc.name}</td>
                      <td className="py-3 px-2 font-bold text-indigo-700">{loc.region}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.visited ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                          {loc.visited ? 'Đã đi' : 'Chưa đi'}
                        </span>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">{formatDateVi(loc.plannedDate) || '—'}</td>
                      <td className="py-3 px-2 italic text-slate-600 max-w-xs break-words">{loc.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-8 text-[11px] text-slate-400 text-center">
                Cảm ơn bạn đã sử dụng Cảm ơn Nhé. Chúc bạn có những chặng đường tuyệt vời!
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-2 print:hidden">
          <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-5 py-6 sm:px-8 text-center">
            <span className="mx-auto w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
              Thư gửi từ người kiến tạo
            </p>
            <p className="mt-2 text-sm italic text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              "Xin chào, Tôi là Trung tôi thích du lịch nên đã tạo ra Bản đồ cá nhân này, Hoàn toàn miễn phí nhé. &lt;3"
            </p>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
              💾 Mọi địa điểm và ghi chú được lưu ngay trên thiết bị của bạn — dùng mượt trên máy tính, máy tính bảng và điện thoại.
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Cảm ơn Nhé © 2026 · Kiến tạo với sự tối giản & tiện lợi
          </p>
        </footer>
      </main>

      <BottomNav
        active={activeSection}
        onNavigate={scrollToSection}
        onAdd={openAdd}
        onOpenTools={() => openTools(null)}
        toolsOpen={toolsOpen}
      />

      <ToolsMenu
        open={toolsOpen}
        anchor={toolsAnchor}
        onClose={() => setToolsOpen(false)}
        visitedCount={visitedCount}
        totalCount={counts.all}
        onExportCSV={handleExportCSV}
        onImportCSV={() => csvInputRef.current?.click()}
        onPrint={() => window.print()}
        onShare={handleOpenShare}
        onClearVisited={handleClearVisited}
        onReset={handleResetData}
      />

      <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCSV} className="hidden" />

      <AddLocationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddLocation}
        initialLat={clickedLat}
        initialLng={clickedLng}
        isDarkMode={isDarkMode}
        hasGps={hasGps}
        onUseMyLocation={() => {
          if (userLat === undefined || userLng === undefined) return;
          setClickedLat(userLat);
          setClickedLng(userLng);
        }}
        onPickOnMap={() => {
          setIsAddOpen(false);
          scrollToSection('ban-do');
          showToast('Chạm vào bản đồ tại nơi bạn muốn ghim', { tone: 'info' });
        }}
      />

      <EditLocationModal
        location={editingLocation}
        onClose={() => setEditingId(null)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} shareUrl={shareUrl} />

      <ConfirmDialog options={confirm} onClose={() => setConfirm(null)} />

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
