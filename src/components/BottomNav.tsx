import React from 'react';
import { Home, Map as MapIcon, List, LayoutGrid, Plus } from 'lucide-react';

export type SectionId = 'tong-quan' | 'ban-do' | 'dia-diem';

interface BottomNavProps {
  active: string;
  onNavigate: (id: SectionId) => void;
  onAdd: () => void;
  onOpenTools: () => void;
  toolsOpen: boolean;
}

/** Thumb-friendly navigation for phones and tablets (hidden on desktop). */
export const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate, onAdd, onOpenTools, toolsOpen }) => {
  const item = (id: SectionId, label: string, icon: React.ReactNode) => {
    const isActive = !toolsOpen && active === id;
    return (
      <button
        onClick={() => onNavigate(id)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-semibold transition ${
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span
          className={`flex items-center justify-center w-12 h-7 rounded-full transition ${
            isActive ? 'bg-indigo-100 dark:bg-indigo-500/15' : ''
          }`}
        >
          {icon}
        </span>
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 print:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/70 dark:border-slate-800/70 pb-safe"
    >
      <div className="max-w-xl mx-auto flex items-end px-2">
        {item('tong-quan', 'Tổng quan', <Home className="w-5 h-5" />)}
        {item('ban-do', 'Bản đồ', <MapIcon className="w-5 h-5" />)}

        <div className="flex-1 flex justify-center">
          <button
            onClick={onAdd}
            aria-label="Thêm địa điểm"
            className="-mt-6 mb-2 w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-600/35 ring-4 ring-white dark:ring-slate-950 flex items-center justify-center active:scale-95 transition"
            id="fab-add-location"
          >
            <Plus className="w-6.5 h-6.5" />
          </button>
        </div>

        {item('dia-diem', 'Địa điểm', <List className="w-5 h-5" />)}
        <button
          onClick={onOpenTools}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-semibold transition ${
            toolsOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
          id="tools-btn-mobile"
        >
          <span
            className={`flex items-center justify-center w-12 h-7 rounded-full transition ${
              toolsOpen ? 'bg-indigo-100 dark:bg-indigo-500/15' : ''
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </span>
          Tiện ích
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
