import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Save,
  FolderOpen,
  Printer,
  Share2,
  Trash2,
  RotateCcw,
  ChevronRight,
  X,
  HardDrive,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ToolsMenuProps {
  open: boolean;
  /** Header button rect: the menu anchors under it on desktop */
  anchor: DOMRect | null;
  onClose: () => void;
  visitedCount: number;
  totalCount: number;
  onExportCSV: () => void;
  onImportCSV: () => void;
  onPrint: () => void;
  onShare: () => void;
  onClearVisited: () => void;
  onReset: () => void;
}

interface ToolItem {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  tint: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/** All occasional actions in one place: dropdown on desktop, bottom sheet on phones. */
export const ToolsMenu: React.FC<ToolsMenuProps> = ({
  open,
  anchor,
  onClose,
  visitedCount,
  totalCount,
  onExportCSV,
  onImportCSV,
  onPrint,
  onShare,
  onClearVisited,
  onReset,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const sections: { title: string; items: ToolItem[] }[] = [
    {
      title: 'Sao lưu & dữ liệu',
      items: [
        {
          key: 'export',
          title: 'Lưu file CSV',
          desc: 'Sao lưu vào Tệp / iCloud Drive',
          icon: <Save className="w-4.5 h-4.5" />,
          tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
          onClick: run(onExportCSV),
          disabled: totalCount === 0,
        },
        {
          key: 'import',
          title: 'Mở file CSV',
          desc: 'Khôi phục hoặc gộp từ bản sao lưu',
          icon: <FolderOpen className="w-4.5 h-4.5" />,
          tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
          onClick: run(onImportCSV),
        },
        {
          key: 'print',
          title: 'Xuất PDF / In',
          desc: 'In danh sách hành trình gọn đẹp',
          icon: <Printer className="w-4.5 h-4.5" />,
          tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
          onClick: run(onPrint),
          disabled: totalCount === 0,
        },
      ],
    },
    {
      title: 'Chia sẻ',
      items: [
        {
          key: 'share',
          title: 'Chia sẻ lịch trình',
          desc: 'Gửi link qua Zalo, Messenger, Facebook…',
          icon: <Share2 className="w-4.5 h-4.5" />,
          tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
          onClick: run(onShare),
          disabled: totalCount === 0,
        },
      ],
    },
    {
      title: 'Dọn dẹp',
      items: [
        {
          key: 'clear',
          title: `Xóa các điểm đã đi${visitedCount ? ` (${visitedCount})` : ''}`,
          desc: 'Giữ danh sách gọn, chỉ còn nơi chưa đến',
          icon: <Trash2 className="w-4.5 h-4.5" />,
          tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
          onClick: run(onClearVisited),
          disabled: visitedCount === 0,
          danger: true,
        },
        {
          key: 'reset',
          title: 'Khôi phục dữ liệu mẫu',
          desc: 'Thay bằng 8 địa danh tiêu biểu',
          icon: <RotateCcw className="w-4.5 h-4.5" />,
          tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
          onClick: run(onReset),
        },
      ],
    },
  ];

  const desktopStyle =
    isDesktop && anchor
      ? { top: anchor.bottom + 8, right: Math.max(16, window.innerWidth - anchor.right) }
      : undefined;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9000] print:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 lg:bg-transparent backdrop-blur-[1px] lg:backdrop-blur-none"
          />
          <motion.div
            role="dialog"
            aria-label="Tiện ích"
            initial={isDesktop ? { opacity: 0, y: -6, scale: 0.98 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, y: -6, scale: 0.98 } : { y: '100%' }}
            transition={isDesktop ? { duration: 0.15 } : { type: 'spring', damping: 30, stiffness: 320 }}
            style={desktopStyle}
            className={
              isDesktop
                ? 'absolute w-[22rem] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 dark:ring-white/10 p-2'
                : 'absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white dark:bg-slate-900 shadow-2xl p-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
            }
          >
            {!isDesktop && (
              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <span className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                <h2 className="pt-3 text-base font-bold text-slate-900 dark:text-white">Tiện ích</h2>
                <button
                  onClick={onClose}
                  className="mt-2 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {sections.map((section) => (
              <div key={section.title} className="py-1">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 disabled:opacity-40 disabled:pointer-events-none transition group"
                  >
                    <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.tint}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm font-semibold ${
                          item.danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{item.desc}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            ))}

            <div className="mx-2 mt-1 mb-1 flex items-start gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <HardDrive className="w-4 h-4 shrink-0 mt-px" />
              <span>
                Dữ liệu được lưu ngay trên thiết bị này. Hãy <b className="text-slate-700 dark:text-slate-200">Lưu file CSV</b> định kỳ để không mất hành trình khi đổi máy.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ToolsMenu;
