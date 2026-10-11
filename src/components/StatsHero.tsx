import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { MapPin, CheckCircle2, Flag, CalendarClock, LocateFixed, Lightbulb, ChevronRight } from 'lucide-react';
import { TravelLocation } from '../types';
import { daysUntil, describeCountdown, formatKm, splitName } from '../lib/utils';

interface StatsHeroProps {
  locations: TravelLocation[];
  distances: Record<string, number>;
  onSelect: (location: TravelLocation) => void;
  onAdd: () => void;
}

const ProgressRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 92 }) => {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * percent) / 100 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-2xl font-extrabold">{percent}%</span>
        <span className="text-[10px] font-semibold text-white/75 mt-1">đã đi</span>
      </div>
    </div>
  );
};

/** Colourful summary of the journey with a smart "next up" tile. */
export const StatsHero: React.FC<StatsHeroProps> = ({ locations, distances, onSelect, onAdd }) => {
  const total = locations.length;
  const visited = locations.filter((l) => l.visited).length;
  const remaining = total - visited;
  const percent = total ? Math.round((visited / total) * 100) : 0;

  const motivation =
    total === 0
      ? 'Bắt đầu bằng việc ghim địa điểm đầu tiên nhé!'
      : percent === 100
        ? 'Tuyệt vời! Bạn đã đi hết danh sách 🎉'
        : visited === 0
          ? 'Chuyến đi đầu tiên đang chờ bạn ✈️'
          : percent >= 50
            ? `Đã qua nửa chặng đường — còn ${remaining} điểm nữa thôi 💪`
            : `Còn ${remaining} điểm đang chờ bạn khám phá 🚀`;

  // Smart tile: next planned trip, else the closest unvisited place, else a tip
  const highlight = useMemo(() => {
    const todo = locations.filter((l) => !l.visited);
    const upcoming = todo
      .map((l) => ({ l, d: daysUntil(l.plannedDate) }))
      .filter((x): x is { l: TravelLocation; d: number } => x.d !== null && x.d >= 0)
      .sort((a, b) => a.d - b.d)[0];
    if (upcoming) {
      return {
        label: 'Chuyến sắp tới',
        icon: <CalendarClock className="w-4 h-4" />,
        title: splitName(upcoming.l.name).title,
        sub: describeCountdown(upcoming.d),
        location: upcoming.l,
      };
    }
    const nearest = todo
      .filter((l) => distances[l.id] !== undefined)
      .sort((a, b) => distances[a.id] - distances[b.id])[0];
    if (nearest) {
      return {
        label: 'Gần bạn nhất',
        icon: <LocateFixed className="w-4 h-4" />,
        title: splitName(nearest.name).title,
        sub: `Cách ${formatKm(distances[nearest.id])}`,
        location: nearest,
      };
    }
    if (locations.length === 0) {
      return {
        label: 'Bắt đầu nhé',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Ghim điểm đầu tiên',
        sub: 'Chạm để thêm địa điểm',
        location: undefined,
      };
    }
    return {
      label: 'Mẹo nhỏ',
      icon: <Lightbulb className="w-4 h-4" />,
      title: 'Đặt ngày dự kiến',
      sub: 'để có đếm ngược',
      location: undefined,
    };
  }, [locations, distances]);

  const tiles = [
    { label: 'Tổng địa điểm', value: total, icon: <MapPin className="w-4 h-4" /> },
    { label: 'Đã đi', value: visited, icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'Chưa đi', value: remaining, icon: <Flag className="w-4 h-4" /> },
  ];

  return (
    <section
      id="tong-quan"
      className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-700 dark:via-violet-700 dark:to-fuchsia-700 text-white p-5 sm:p-6 shadow-xl shadow-indigo-600/20 print:hidden"
    >
      {/* Decorative glow */}
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
        <div className="flex items-center gap-4 sm:gap-5 lg:flex-1 min-w-0">
          <ProgressRing percent={percent} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Hành trình của bạn</p>
            <h2 className="mt-1 text-lg sm:text-2xl font-extrabold leading-tight">
              {total === 0 ? (
                'Chưa có địa điểm nào'
              ) : (
                <>
                  <span className="sm:hidden">Đã đi</span>
                  <span className="hidden sm:inline">Đã chinh phục</span> {visited}/{total} địa danh
                </>
              )}
            </h2>
            <p className="mt-1 text-sm text-white/85">{motivation}</p>
            {total === 0 && (
              <button
                onClick={onAdd}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white text-indigo-700 px-3.5 py-2 text-sm font-bold shadow-lg hover:bg-indigo-50 transition"
              >
                Thêm địa điểm đầu tiên
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 lg:w-[26rem] xl:w-[40rem] shrink-0">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl bg-white/12 ring-1 ring-white/15 backdrop-blur-sm px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-white/75 text-xs font-medium whitespace-nowrap">
                {t.icon}
                {t.label}
              </div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{t.value}</div>
            </div>
          ))}

          <button
            type="button"
            disabled={!highlight.location && total > 0}
            onClick={() => (highlight.location ? onSelect(highlight.location) : onAdd())}
            className="text-left rounded-2xl bg-white text-slate-900 shadow-lg shadow-indigo-900/20 px-3.5 py-3 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 transition disabled:cursor-default"
            title={highlight.location ? 'Xem trên bản đồ' : undefined}
          >
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold whitespace-nowrap">
              {highlight.icon}
              {highlight.label}
            </div>
            <div className="mt-1 text-sm font-bold truncate">{highlight.title}</div>
            <div className="text-xs text-slate-500 truncate">{highlight.sub}</div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default StatsHero;
