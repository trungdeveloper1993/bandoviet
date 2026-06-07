import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Trash2, CheckCircle2, Circle, Edit3, Check, X, FileText, Navigation } from 'lucide-react';
import { TravelLocation } from '../types';

interface LocationCardProps {
  location: TravelLocation;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate?: () => void;
  onToggleVisited: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
  onNavigate,
  onToggleVisited,
  onDelete,
  onUpdateNotes,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(location.notes);

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNotes(editedNotes);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setEditedNotes(location.notes);
    setIsEditingNotes(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`group shrink-0 relative bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between rounded-3xl overflow-hidden ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-550/20 dark:ring-indigo-400/20 shadow-md scale-[1.01]'
          : 'border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:scale-[1.01]'
      }`}
    >
      {/* Location Image Header & Badge */}
      <div className="relative h-40 w-full overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800/40">
        <img
          src={location.image}
          alt={location.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none filter contrast-[1.02]"
        />
        {/* Dark solid overlay at bottom for maximum legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Region Tag with sleek material rounded pill borders */}
        <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {location.region}
        </span>

        {/* Checked/Visited overlay marker - material style */}
        {location.visited && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1.5 animate-pulse">
            <span className="text-[9px] font-extrabold uppercase">ĐÃ ĐI</span>
            <Check className="w-2.5 h-2.5 stroke-[4]" />
          </div>
        )}

        {/* Name over gradient */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white pointer-events-none">
          <h4 className="text-[7.5px] font-extrabold uppercase tracking-widest text-indigo-300 mb-0.5 font-mono">
            ★ COORD_PIN
          </h4>
          <h3 className="text-xs font-extrabold tracking-tight line-clamp-1 text-slate-50 uppercase font-sans">
            {location.name}
          </h3>
        </div>
      </div>

      {/* Card Content body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        
        {/* Checkbox Visited trigger & Quick details */}
        <div className="flex items-start gap-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisited();
            }}
            className="mt-0.5 shrink-0 focus:outline-none transition-transform active:scale-90 text-slate-800 dark:text-slate-200 cursor-pointer"
            title={location.visited ? "Đánh dấu là chưa đi" : "Đánh dấu đã hoàn thành"}
            id={`toggle-${location.id}`}
          >
            {location.visited ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-[9px]">
                ✔
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-350 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition" />
            )}
          </button>

          <div className="space-y-0.5 select-none flex-1">
            <p
              onClick={onSelect}
              className={`text-xs font-bold leading-tight cursor-pointer hover:text-indigo-500 transition-colors ${
                location.visited ? 'text-slate-400 dark:text-slate-550 line-through' : 'text-slate-850 dark:text-slate-100'
              }`}
            >
              {location.name}
            </p>
            {location.plannedDate && (
              <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-450 font-mono">
                <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>Kế hoạch: {new Date(location.plannedDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Notes (Ghi chú cá nhân) */}
        <div className="bg-slate-50 dark:bg-slate-850/50 p-2.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest shrink-0 font-mono">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-500" />
              Ghi chú cá nhân:
            </span>
            {!isEditingNotes && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(true);
                }}
                className="hover:text-indigo-500 p-0.5 border border-transparent transition-colors cursor-pointer"
                title="Sửa ghi chú"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <form onSubmit={handleSaveNotes} className="space-y-1.5 mt-1">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100 resize-none font-sans"
                placeholder="Nhập ghi chú cá nhân..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex justify-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelNotes();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                  title="Hủy"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <button
                  type="submit"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer"
                  title="Lưu"
                >
                  <Check className="w-2.5 h-2.5" />
                </button>
              </div>
            </form>
          ) : (
            <p className="italic text-slate-600 dark:text-slate-350 text-[10.5px] leading-relaxed break-words line-clamp-3">
              {location.notes ? `${location.notes}` : 'Chưa có ghi chú nào. Hãy nhập vào ngay nhé!'}
            </p>
          )}
        </div>

        {/* Footer actions - flat material design */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-805/60 dark:border-slate-800/40 flex items-center justify-between gap-1 shrink-0 select-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) {
                onNavigate();
              } else {
                onSelect();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-full transition cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
            }`}
            title="Chỉ đường realtime từ vị trí của bạn tới đây"
          >
            <Navigation className="w-2.5 h-2.5" />
            <span>Bay tới</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 px-2 rounded-full bg-rose-50/80 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer font-bold"
            title="Xóa địa điểm"
            id={`delete-${location.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
export default LocationCard;

