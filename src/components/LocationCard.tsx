import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  CalendarDays,
  LocateFixed,
  Navigation,
  Map as MapIcon,
  Pencil,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react';
import { TravelLocation } from '../types';
import {
  daysUntil,
  describeCountdown,
  formatDateVi,
  formatKm,
  googleMapsDirectionsUrl,
  splitName,
} from '../lib/utils';
import SmartImage from './SmartImage';
import ActionMenu from './ActionMenu';

export interface LocationItemProps {
  location: TravelLocation;
  isSelected: boolean;
  distanceKm?: number;
  onSelect: () => void;
  onNavigate: () => void;
  onToggleVisited: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyCoords: () => void;
  onUpdateNotes: (notes: string) => void;
  /** React 19 passes refs as props; AnimatePresence "popLayout" needs it to pop exiting items */
  ref?: React.Ref<HTMLElement>;
}

/** Date + countdown text shared by card and row. */
export function dateLabel(location: TravelLocation): { text: string; tone: 'upcoming' | 'past' | 'plain' } | null {
  if (!location.plannedDate) return null;
  const date = formatDateVi(location.plannedDate);
  const days = daysUntil(location.plannedDate);
  if (location.visited || days === null) return { text: date, tone: 'plain' };
  return { text: `${date} · ${describeCountdown(days)}`, tone: days >= 0 ? 'upcoming' : 'past' };
}

export const LocationCard: React.FC<LocationItemProps> = ({
  location,
  isSelected,
  distanceKm,
  onSelect,
  onNavigate,
  onToggleVisited,
  onEdit,
  onDelete,
  onCopyCoords,
  onUpdateNotes,
  ref,
}) => {
  const { title, subtitle } = splitName(location.name);
  const date = dateLabel(location);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(location.notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editingNotes) setNotesDraft(location.notes);
  }, [location.notes, editingNotes]);

  useEffect(() => {
    if (editingNotes) {
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingNotes]);

  const saveNotes = () => {
    onUpdateNotes(notesDraft.trim());
    setEditingNotes(false);
  };

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 overflow-hidden transition-shadow duration-300 ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/15'
          : 'ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-sm hover:shadow-lg hover:shadow-slate-900/5'
      }`}
    >
      {/* Cover image: tap to show on the map */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-label={`Xem ${title} trên bản đồ`}
        className="relative h-40 overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <SmartImage
          src={location.image}
          alt={location.name}
          seed={location.id}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-black/0 pointer-events-none" />

        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 backdrop-blur-sm shadow-sm">
          {location.region}
        </span>

        <div className="absolute bottom-3 left-3.5 right-3.5 text-white pointer-events-none">
          <h3 className={`text-base font-bold leading-snug line-clamp-1 ${location.visited ? 'opacity-90' : ''}`}>
            {title}
          </h3>
          {subtitle && <p className="text-xs text-white/80 line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      {/* Visited toggle doubles as the status badge */}
      <button
        onClick={onToggleVisited}
        aria-pressed={location.visited}
        title={location.visited ? 'Bỏ đánh dấu đã đi' : 'Đánh dấu đã đi'}
        className={`absolute top-3 right-3 flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-full text-[11px] font-bold shadow-md backdrop-blur-sm active:scale-95 transition ${
          location.visited
            ? 'bg-emerald-500 text-white'
            : 'bg-white/90 text-slate-700 hover:bg-white dark:bg-slate-900/80 dark:text-slate-200'
        }`}
        id={`toggle-${location.id}`}
      >
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center ${
            location.visited ? 'bg-white/25' : 'ring-2 ring-slate-300 dark:ring-slate-500'
          }`}
        >
          {location.visited && <Check className="w-3 h-3 animate-pop" strokeWidth={3.5} />}
        </span>
        {location.visited ? 'Đã đi' : 'Chưa đi'}
      </button>

      <div className="flex-1 flex flex-col gap-3 p-3.5">
        {(date || distanceKm !== undefined) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {date && (
              <span
                className={`inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[11.5px] font-semibold ${
                  date.tone === 'upcoming'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : date.tone === 'past'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {date.text}
              </span>
            )}
            {distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[11.5px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <LocateFixed className="w-3.5 h-3.5" />
                Cách {formatKm(distanceKm)}
              </span>
            )}
          </div>
        )}

        {/* Notes with quick inline editing */}
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNotes();
                if (e.key === 'Escape') setEditingNotes(false);
              }}
              rows={3}
              placeholder="Món ngon, góc check-in, lưu ý…"
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 text-[15px] sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 outline-none ring-2 ring-indigo-500/40 resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setEditingNotes(false)}
                className="h-8 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Hủy
              </button>
              <button
                onClick={saveNotes}
                className="h-8 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        ) : location.notes ? (
          <button
            onClick={() => setEditingNotes(true)}
            title="Chạm để sửa ghi chú"
            className="group/notes text-left text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 rounded-xl -mx-1 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
          >
            {location.notes}
            <Pencil className="inline w-3 h-3 ml-1.5 -mt-0.5 opacity-0 group-hover/notes:opacity-60 transition" />
          </button>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="self-start inline-flex items-center gap-1 text-[13px] font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm ghi chú
          </button>
        )}

        <div className="mt-auto pt-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition"
            title="Chỉ đường realtime từ vị trí của bạn tới đây"
          >
            <Navigation className="w-3.5 h-3.5" />
            Bay tới
          </button>
          <a
            href={googleMapsDirectionsUrl(location.lat, location.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition"
            title="Mở chỉ đường trong Google Maps"
          >
            <MapIcon className="w-3.5 h-3.5" />
            Maps
          </a>
          <div className="flex-1" />
          <ActionMenu
            items={[
              { label: 'Sửa thông tin', icon: <Pencil className="w-4 h-4" />, onSelect: onEdit },
              { label: 'Sao chép tọa độ', icon: <Copy className="w-4 h-4" />, onSelect: onCopyCoords },
              { label: 'Xóa địa điểm', icon: <Trash2 className="w-4 h-4" />, onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
    </motion.article>
  );
};

export default LocationCard;
