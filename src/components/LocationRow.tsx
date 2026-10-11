import React from 'react';
import { motion } from 'motion/react';
import { Check, Navigation, Map as MapIcon, Pencil, Copy, Trash2 } from 'lucide-react';
import { formatKm, googleMapsDirectionsUrl, splitName } from '../lib/utils';
import SmartImage from './SmartImage';
import ActionMenu from './ActionMenu';
import { LocationItemProps, dateLabel } from './LocationCard';

/** Compact one-line row for managing long lists quickly. */
export const LocationRow: React.FC<LocationItemProps> = ({
  location,
  isSelected,
  distanceKm,
  onSelect,
  onNavigate,
  onToggleVisited,
  onEdit,
  onDelete,
  onCopyCoords,
  ref,
}) => {
  const { title } = splitName(location.name);
  const date = dateLabel(location);
  const meta = [
    location.region,
    date?.text,
    distanceKm !== undefined ? formatKm(distanceKm) : undefined,
  ].filter(Boolean);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={`flex items-center gap-3 p-2 pr-1.5 rounded-2xl bg-white dark:bg-slate-900 transition-shadow ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10'
          : 'ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="relative shrink-0">
        <button
          onClick={onSelect}
          className="block w-14 h-14 rounded-xl overflow-hidden"
          aria-label={`Xem ${title} trên bản đồ`}
        >
          <SmartImage
            src={location.image}
            alt={location.name}
            seed={location.id}
            className={`w-full h-full object-cover ${location.visited ? 'saturate-50' : ''}`}
            emojiClassName="text-2xl"
          />
        </button>
        <button
          onClick={onToggleVisited}
          aria-pressed={location.visited}
          title={location.visited ? 'Bỏ đánh dấu đã đi' : 'Đánh dấu đã đi'}
          className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow transition active:scale-90 ${
            location.visited ? 'bg-emerald-500 text-white' : 'bg-white text-transparent dark:bg-slate-800'
          }`}
          id={`toggle-${location.id}`}
        >
          {location.visited ? (
            <Check className="w-3.5 h-3.5 animate-pop" strokeWidth={3.5} />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full ring-2 ring-slate-300 dark:ring-slate-500" />
          )}
        </button>
      </div>

      <button onClick={onSelect} className="flex-1 min-w-0 text-left py-0.5">
        <p
          className={`text-[15px] font-semibold truncate ${
            location.visited ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'
          }`}
        >
          {title}
        </p>
        <p
          className={`text-xs truncate ${
            date?.tone === 'past' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {meta.join(' · ')}
        </p>
        {location.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{location.notes}</p>
        )}
      </button>

      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onNavigate}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition"
          title="Bay tới — chỉ đường realtime"
          aria-label={`Chỉ đường tới ${title}`}
        >
          <Navigation className="w-4 h-4" />
        </button>
        <a
          href={googleMapsDirectionsUrl(location.lat, location.lng)}
          target="_blank"
          rel="noreferrer"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition"
          title="Mở Google Maps"
          aria-label={`Mở ${title} trong Google Maps`}
        >
          <MapIcon className="w-4 h-4" />
        </a>
        <ActionMenu
          items={[
            { label: 'Sửa thông tin', icon: <Pencil className="w-4 h-4" />, onSelect: onEdit },
            { label: 'Sao chép tọa độ', icon: <Copy className="w-4 h-4" />, onSelect: onCopyCoords },
            { label: 'Xóa địa điểm', icon: <Trash2 className="w-4 h-4" />, onSelect: onDelete, danger: true },
          ]}
        />
      </div>
    </motion.div>
  );
};

export default LocationRow;
