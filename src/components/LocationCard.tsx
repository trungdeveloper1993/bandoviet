import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Trash2, CheckCircle2, Circle, Edit3, Check, X, FileText } from 'lucide-react';
import { TravelLocation } from '../types';

interface LocationCardProps {
  location: TravelLocation;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisited: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`group shrink-0 relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-500 shadow-lg ring-4 ring-indigo-500/10'
          : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Location Image Header & Badge */}
      <div className="relative h-44 w-full overflow-hidden shrink-0">
        <img
          src={location.image}
          alt={location.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Dark linear gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Region Tag */}
        <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-slate-100 dark:border-slate-800">
          {location.region}
        </span>

        {/* Checked/Visited overlay marker */}
        {location.visited && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-10 flex items-center justify-center animate-bounce">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}

        {/* Name over gradient */}
        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 drop-shadow-sm mb-0.5">
            DANH THẮNG
          </h4>
          <h3 className="text-sm font-extrabold tracking-tight line-clamp-1 text-slate-50 drop-shadow-md">
            {location.name}
          </h3>
        </div>
      </div>

      {/* Card Content body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        
        {/* Checkbox Visited trigger & Quick details */}
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisited();
            }}
            className="mt-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-lg transition-transform active:scale-90"
            title={location.visited ? "Đánh dấu là chưa đi" : "Đánh dấu đã hoàn thành"}
            id={`toggle-${location.id}`}
          >
            {location.visited ? (
              <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 fill-emerald-500/10 stroke-[2.2]" />
            ) : (
              <Circle className="w-5.5 h-5.5 text-slate-400 hover:text-indigo-500 transition-colors stroke-[2.2]" />
            )}
          </button>

          <div className="space-y-1 select-none flex-1">
            <p
              onClick={onSelect}
              className={`text-xs font-bold tracking-tight cursor-pointer hover:text-indigo-500 transition-colors ${
                location.visited ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {location.name}
            </p>
            {location.plannedDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-450 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kế hoạch: {new Date(location.plannedDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Notes (Ghi chú cá nhân) */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Ghi chú cá nhân:
            </span>
            {!isEditingNotes && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(true);
                }}
                className="hover:text-indigo-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sửa ghi chú"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <form onSubmit={handleSaveNotes} className="space-y-2 mt-1">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 resize-none font-sans"
                placeholder="Nhập ghi chú cá nhân..."
                autoFocus
              />
              <div className="flex justify-end gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelNotes}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-500 dark:text-slate-400"
                  title="Hủy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                  title="Lưu"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <p className="italic text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed break-words line-clamp-3">
              {location.notes ? location.notes : 'Chưa có ghi chú nào. Hãy bắt tay viết kế hoạch lịch trình ngay!'}
            </p>
          )}
        </div>

        {/* Footer actions: Map locator & Delete elements */}
        <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between gap-1 shrink-0">
          <button
            onClick={onSelect}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400'
            }`}
            title="Định vị địa điểm này trên Bản đồ học"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Định vị bản đồ</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-95"
            title="Xóa địa điểm khỏi lịch trình"
            id={`delete-${location.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
export default LocationCard;
