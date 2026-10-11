import React from 'react';
import { Smile, Moon, Sun, LayoutGrid, Plus } from 'lucide-react';

interface AppHeaderProps {
  isDarkMode: boolean;
  onToggleDark: () => void;
  onOpenTools: (anchor: DOMRect) => void;
  onAdd: () => void;
  toolsOpen: boolean;
}

/** Sticky, translucent app bar. Phones get the add/tools actions in the bottom nav instead. */
export const AppHeader: React.FC<AppHeaderProps> = ({
  isDarkMode,
  onToggleDark,
  onOpenTools,
  onAdd,
  toolsOpen,
}) => (
  <header className="sticky top-0 z-40 print:hidden bg-[#f6f7fb]/80 dark:bg-[#070b14]/75 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
      <a href="#tong-quan" className="flex items-center gap-3 min-w-0 group" aria-label="Cảm ơn Nhé — về đầu trang">
        <span className="shrink-0 w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-active:scale-95 transition">
          <Smile className="w-5.5 h-5.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Cảm ơn Nhé <span aria-hidden>😊</span>
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
            Bản đồ hành trình của bạn
          </span>
        </span>
      </a>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onToggleDark}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 transition"
          title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          aria-label="Đổi giao diện sáng/tối"
          id="theme-toggler"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={(e) => onOpenTools(e.currentTarget.getBoundingClientRect())}
          aria-haspopup="dialog"
          aria-expanded={toolsOpen}
          className={`hidden lg:flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-semibold transition ${
            toolsOpen
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-700 bg-white shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:ring-slate-700'
          }`}
          id="tools-btn"
        >
          <LayoutGrid className="w-4 h-4" />
          Tiện ích
        </button>

        <button
          onClick={onAdd}
          className="hidden lg:flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition"
          id="master-add-location-btn"
        >
          <Plus className="w-4.5 h-4.5" />
          Thêm địa điểm
        </button>
      </div>
    </div>
  </header>
);

export default AppHeader;
