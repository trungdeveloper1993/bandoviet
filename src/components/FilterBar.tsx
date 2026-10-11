import React from 'react';
import { Search, X, ArrowUpDown, ChevronDown, LayoutGrid, Rows3, Check } from 'lucide-react';
import { Region } from '../types';
import { REGIONS } from '../lib/utils';

export type StatusFilter = 'all' | 'todo' | 'done';
export type SortKey = 'recent' | 'name' | 'date' | 'distance';
export type ViewMode = 'grid' | 'list';

export const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Mới thêm',
  name: 'Tên A–Z',
  date: 'Ngày đi',
  distance: 'Gần tôi',
};

interface FilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  status: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  region: Region;
  onRegion: (value: Region) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  view: ViewMode;
  onView: (value: ViewMode) => void;
  counts: Record<StatusFilter, number>;
  regionCounts: Record<string, number>;
  hasGps: boolean;
}

/** Search, quick filters, sorting and view switch in one compact toolbar. */
export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearch,
  status,
  onStatus,
  region,
  onRegion,
  sort,
  onSort,
  view,
  onView,
  counts,
  regionCounts,
  hasGps,
}) => {
  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'todo', label: 'Chưa đi' },
    { key: 'done', label: 'Đã đi' },
  ];
  const visibleRegions = REGIONS.filter((r) => (regionCounts[r] ?? 0) > 0 || region === r);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-sm p-2.5 sm:p-3 space-y-2.5 print:hidden">
      <div className="flex items-center gap-2">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Tìm kiếm địa điểm</span>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm tên, ghi chú…"
            className="w-full h-11 pl-10 pr-9 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 text-[15px] sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-slate-800 transition [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700 dark:hover:text-white transition"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </label>

        {/* Sort: icon-only on phones, labelled from sm */}
        <label className="relative shrink-0" title="Sắp xếp">
          <span className="sr-only">Sắp xếp</span>
          <ArrowUpDown className="absolute left-3.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="appearance-none h-11 w-11 sm:w-[8.25rem] sm:pl-9 sm:pr-7 rounded-2xl truncate bg-slate-100/80 dark:bg-slate-800/70 text-transparent sm:text-slate-700 sm:dark:text-slate-200 text-sm font-semibold outline-none ring-2 ring-transparent focus:ring-indigo-500/40 cursor-pointer transition"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option
                key={key}
                value={key}
                disabled={key === 'distance' && !hasGps}
                className="text-slate-900"
              >
                {SORT_LABELS[key]}
                {key === 'distance' && !hasGps ? ' (cần GPS)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </label>

        {/* View toggle */}
        <div className="shrink-0 flex h-11 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70" role="group" aria-label="Kiểu hiển thị">
          {(
            [
              { key: 'grid', icon: <LayoutGrid className="w-4 h-4" />, label: 'Dạng thẻ' },
              { key: 'list', icon: <Rows3 className="w-4 h-4" />, label: 'Dạng danh sách' },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => onView(v.key)}
              aria-pressed={view === v.key}
              title={v.label}
              className={`w-9 rounded-xl flex items-center justify-center transition ${
                view === v.key
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Quick filters: status tabs + region chips (scrolls sideways on phones) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-2.5 px-2.5 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
        <div className="shrink-0 flex p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70" role="tablist" aria-label="Trạng thái">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={status === tab.key}
              onClick={() => onStatus(tab.key)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-semibold whitespace-nowrap transition ${
                status === tab.key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span
                className={`min-w-5 px-1.5 h-5 rounded-full text-[11px] leading-5 text-center tabular-nums ${
                  status === tab.key
                    ? tab.key === 'done'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : tab.key === 'todo'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {visibleRegions.length > 0 && <span aria-hidden className="sm:hidden shrink-0 w-px h-6 bg-slate-200 dark:bg-slate-700" />}

        {visibleRegions.map((r) => {
          const active = region === r;
          return (
            <button
              key={r}
              onClick={() => onRegion(active ? 'Tất cả' : r)}
              aria-pressed={active}
              className={`shrink-0 flex items-center gap-1.5 h-10 px-3.5 rounded-2xl text-[13px] font-semibold whitespace-nowrap ring-1 transition ${
                active
                  ? 'bg-indigo-600 text-white ring-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:ring-slate-600'
              }`}
              id={`filter-${r}`}
            >
              {active && <Check className="w-3.5 h-3.5" />}
              {r}
              <span className={`tabular-nums text-xs ${active ? 'text-white/80' : 'text-slate-400'}`}>
                {regionCounts[r] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
