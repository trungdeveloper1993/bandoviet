import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Trash2, Image as ImageIcon, CalendarDays, MapPin, Check } from 'lucide-react';
import { TravelLocation } from '../types';
import { REGIONS, FALLBACK_IMAGE } from '../lib/utils';
import SmartImage from './SmartImage';

interface EditLocationModalProps {
  location: TravelLocation | null;
  onClose: () => void;
  onSave: (updated: TravelLocation) => void;
  onDelete: (id: string) => void;
}

const inputClass =
  'w-full h-11 px-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 text-[15px] sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-slate-800 transition';

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode; hint?: string }> = ({
  label,
  icon,
  children,
  hint,
}) => (
  <label className="block">
    <span className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
      {icon}
      {label}
    </span>
    {children}
    {hint && <span className="block mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
  </label>
);

/** Edit every detail of a saved place (bottom sheet on phones, dialog on desktop). */
export const EditLocationModal: React.FC<EditLocationModalProps> = ({ location, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState<TravelLocation | null>(location);
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');

  useEffect(() => {
    setDraft(location);
    if (location) {
      setLatText(String(location.lat));
      setLngText(String(location.lng));
    }
  }, [location]);

  useEffect(() => {
    if (!location) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location, onClose]);

  const set = <K extends keyof TravelLocation>(key: K, value: TravelLocation[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const lat = parseFloat(latText.replace(',', '.'));
  const lng = parseFloat(lngText.replace(',', '.'));
  const coordsValid = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const canSave = !!draft && draft.name.trim().length > 0 && coordsValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !canSave) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      notes: draft.notes.trim(),
      image: draft.image.trim() || FALLBACK_IMAGE,
      plannedDate: draft.plannedDate || undefined,
      lat,
      lng,
    });
  };

  return (
    <AnimatePresence>
      {/* Render only once the draft matches the requested place (no stale flash) */}
      {location && draft && draft.id === location.id && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4 print:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <motion.form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 id="edit-title" className="text-base font-bold text-slate-900 dark:text-white">
                Sửa địa điểm
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="relative h-36 rounded-2xl overflow-hidden">
                <SmartImage
                  src={draft.image}
                  alt={draft.name || 'Ảnh địa điểm'}
                  seed={draft.id}
                  className="w-full h-full object-cover"
                  emojiClassName="text-5xl"
                />
                <button
                  type="button"
                  onClick={() => set('visited', !draft.visited)}
                  className={`absolute top-3 right-3 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold shadow-md transition ${
                    draft.visited ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-700'
                  }`}
                  aria-pressed={draft.visited}
                >
                  {draft.visited ? <Check className="w-3.5 h-3.5" /> : <span className="w-3 h-3 rounded-full border-2 border-slate-400" />}
                  {draft.visited ? 'Đã đi' : 'Chưa đi'}
                </button>
              </div>

              <Field label="Tên địa điểm" icon={<MapPin className="w-3.5 h-3.5" />}>
                <input
                  required
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="VD: Đồi chè Cầu Đất, Đà Lạt"
                  className={inputClass}
                />
              </Field>

              <div>
                <span className="block mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Khu vực</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set('region', r)}
                      className={`h-10 rounded-xl text-[13px] font-semibold ring-1 transition ${
                        draft.region === r
                          ? 'bg-indigo-600 text-white ring-indigo-600'
                          : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Ngày dự kiến đi" icon={<CalendarDays className="w-3.5 h-3.5" />}>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={draft.plannedDate ?? ''}
                    onChange={(e) => set('plannedDate', e.target.value || undefined)}
                    className={inputClass}
                  />
                  {draft.plannedDate && (
                    <button
                      type="button"
                      onClick={() => set('plannedDate', undefined)}
                      className="shrink-0 h-11 px-3 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                    >
                      Bỏ ngày
                    </button>
                  )}
                </div>
              </Field>

              <Field label="Ghi chú">
                <textarea
                  rows={4}
                  value={draft.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Món ngon, góc check-in đẹp, lưu ý khi đi…"
                  className={`${inputClass} h-auto py-3 resize-none leading-relaxed`}
                />
              </Field>

              <Field
                label="Link ảnh minh họa"
                icon={<ImageIcon className="w-3.5 h-3.5" />}
                hint="Để trống sẽ dùng ảnh mặc định."
              >
                <input
                  type="url"
                  value={draft.image === FALLBACK_IMAGE ? '' : draft.image}
                  onChange={(e) => set('image', e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </Field>

              <div>
                <span className="block mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tọa độ (vĩ độ, kinh độ)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    inputMode="decimal"
                    value={latText}
                    onChange={(e) => setLatText(e.target.value)}
                    aria-label="Vĩ độ"
                    className={`${inputClass} font-mono`}
                  />
                  <input
                    inputMode="decimal"
                    value={lngText}
                    onChange={(e) => setLngText(e.target.value)}
                    aria-label="Kinh độ"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                {!coordsValid && (
                  <span className="block mt-1 text-xs text-rose-500">Tọa độ chưa hợp lệ.</span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onDelete(draft.id)}
                className="h-11 px-3.5 rounded-2xl flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-2xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="h-11 px-5 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:shadow-none transition"
              >
                Lưu thay đổi
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditLocationModal;
